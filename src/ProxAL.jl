#
# proximal ALM implementation
#
module ProxAL

using Ipopt, JuMP
using Printf, CatViews
using ExaPF
using ExaTron
using LinearAlgebra
using SparseArrays
using MPI

include("Evaluators/Evaluators.jl")
include("params.jl")
include("opfdata.jl")
include("opfsolution.jl")
include("blockmodel.jl")
include("blocks.jl")
include("opfmodel.jl")
include("utils.jl")
include("communication.jl")
include("Evaluators/ProxALEvalutor.jl")
include("Evaluators/NonDecomposedModel.jl")

export ModelParams, AlgParams
export ProxALEvaluator, NonDecomposedModel, set_penalty!
export optimize!
export JuMPBackend, ExaPFBackend, ExaTronBackend

function update_primal_nlpvars(x::PrimalSolution, opfBlockData::OPFBlocks, blk::Int,
                               modelinfo::ModelParams,
                               algparams::AlgParams)
    # FIX ME: Make it work without views also in the non decomposed contingencies case
    if algparams.decompCtgs
        block = opfBlockData.blkIndex[blk]
        k = block[1]
        t = block[2]
        range_k = algparams.decompCtgs ? (k:k) : (1:(modelinfo.num_ctgs + 1))

        from = 1
        to = size(x.Pg,1)*length(range_k)
        x.Pg[:,range_k,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.Qg, 1)*length(range_k)
        x.Qg[:,range_k,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.Vm, 1)*length(range_k)
        x.Vm[:,range_k,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.Va, 1)*length(range_k)
        x.Va[:,range_k,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + length(range_k)
        x.ωt[range_k,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.St, 1)
        x.St[:,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.Zt, 1)
        x.Zt[:,t] .= opfBlockData.colValue[from:to,blk]

        from = 1+to
        to = to + size(x.Sk, 1)*length(range_k)
        x.Sk[:,range_k,t] .= opfBlockData.colValue[from:to,blk]

        # Zk
        from = 1+to
        to = to + size(x.Sk, 1)*length(range_k)
        x.Sk[:,range_k,t] .= opfBlockData.colValue[from:to,blk]
    else
        solution = get_block_view(x, opfBlockData.blkIndex[blk],
                                modelinfo,
                                algparams)
        solution .= opfBlockData.colValue[:,blk]
    end
    return nothing
end

function update_primal_penalty(x::PrimalSolution, opfdata::OPFData,
                               opfBlockData::OPFBlocks, blk::Int,
                               primal::PrimalSolution,
                               dual::DualSolution,
                               modelinfo::ModelParams,
                               algparams::AlgParams)
    (ngen, K, T) = size(x.Pg)
    block = opfBlockData.blkIndex[blk]
    k = block[1]
    t = block[2]

    if modelinfo.time_link_constr_type == :penalty
        β = [opfdata.generators[g].ramp_agc for g=1:ngen]
        if t > 1
            x.Zt[:,t] .= ((algparams.τ*primal.Zt[:,t]) .- dual.ramping[:,t] .-
                            (algparams.ρ_t[:,t].*(+x.Pg[:,1,t-1] .- x.Pg[:,1,t] .+ x.St[:,t] .- β))
                        ) ./  max.(algparams.zero, algparams.τ .+ algparams.ρ_t[:,t] .+ (modelinfo.obj_scale*modelinfo.weight_quadratic_penalty_time))
        end
    end
    if K > 1 && algparams.decompCtgs
        if modelinfo.ctgs_link_constr_type == :frequency_ctrl
            @views for k=2:K
                x.ωt[k,t] = (( algparams.τ*primal.ωt[k,t]) -
                                sum(opfdata.generators[g].alpha *
                                        (dual.ctgs[g,k,t] + (algparams.ρ_c[g,k,t] * (x.Pg[g,1,t] - x.Pg[g,k,t])))
                                    for g=1:ngen)
                            ) ./ max.(algparams.zero, algparams.τ .+ (modelinfo.obj_scale*modelinfo.weight_freq_ctrl) .+
                                    sum(algparams.ρ_c[g,k,t]*(opfdata.generators[g].alpha)^2
                                        for g=1:ngen)
                                )
            end
        end
        if modelinfo.ctgs_link_constr_type ∈ [:preventive_penalty, :corrective_penalty]
            β = zeros(ngen,T)
            if modelinfo.ctgs_link_constr_type == :corrective_penalty
                for g=1:ngen
                    β[g,:] .= opfdata.generators[g].scen_agc
                end
            else
                @assert norm(x.Sk) <= algparams.zero
            end
            @views for k=2:K
                x.Zk[:,k,:] .= ((algparams.τ*primal.Zk[:,k,:]) .- dual.ctgs[:,k,:] .-
                                (algparams.ρ_c[:,k,:].*(+x.Pg[:,1,:] .- x.Pg[:,k,:] .+ x.Sk[:,k,:] .- β))
                            ) ./  max.(algparams.zero, algparams.τ .+ algparams.ρ_c[:,k,:] .+ (modelinfo.obj_scale*modelinfo.weight_quadratic_penalty_ctgs))
            end
        end
    end

    return nothing
end

function update_dual_vars(λ::DualSolution, opfdata::OPFData,
                          opfBlockData::OPFBlocks, blk::Int,
                          primal::PrimalSolution,
                          modelinfo::ModelParams,
                          algparams::AlgParams)
    (ngen, K, T) = size(primal.Pg)
    block = opfBlockData.blkIndex[blk]
    k = block[1]
    t = block[2]

    maxviol_t, maxviol_c = 0.0, 0.0

    if T > 1 || (K > 1 && algparams.decompCtgs)
        d = Dict(:Pg => primal.Pg,
                 :ωt => primal.ωt,
                 :St => primal.St,
                 :Zt => primal.Zt,
                 :Sk => primal.Sk,
                 :Zk => primal.Zk)
    end

    if T > 1
        link_constr = compute_time_linking_constraints(d, opfdata, opfBlockData, blk, modelinfo)
        viol_t = (modelinfo.time_link_constr_type == :inequality) ?
                    max.(link_constr[:ramping_p], link_constr[:ramping_n], 0.0) :
                    abs.(link_constr[:ramping])
        if algparams.updateρ_t
            increaseρ_t = (algparams.ρ_t .< algparams.maxρ_t) .& (viol_t .> algparams.ρ_t_tol)
            subρ_t = @view algparams.ρ_t[increaseρ_t]
            subρ_t .= min.(subρ_t .+ 0.1algparams.maxρ_t, algparams.maxρ_t)
            subρ_t_tol = @view algparams.ρ_t_tol[(.!increaseρ_t) .& (viol_t .<= algparams.ρ_t_tol)]
            subρ_t_tol .= max.(subρ_t_tol./1.2, algparams.zero)
        end

        if modelinfo.time_link_constr_type == :inequality
            λ.ramping_p .= max.(λ.ramping_p .+ (algparams.θ*algparams.ρ_t.*link_constr[:ramping_p]), 0)
            λ.ramping_n .= max.(λ.ramping_n .+ (algparams.θ*algparams.ρ_t.*link_constr[:ramping_n]), 0)
        else
            λ.ramping += algparams.θ*algparams.ρ_t.*link_constr[:ramping]
        end

        maxviol_t = maximum(viol_t)
    end
    if K > 1 && algparams.decompCtgs
        link_constr = compute_ctgs_linking_constraints(d, opfdata, opfBlockData, blk, modelinfo)
        viol_c = (modelinfo.ctgs_link_constr_type == :corrective_inequality) ?
                    max.(link_constr[:ctgs_p], link_constr[:ctgs_n], 0.0) :
                    abs.(link_constr[:ctgs])
        if algparams.updateρ_c
            increaseρ_c = (algparams.ρ_c .< algparams.maxρ_c) .& (viol_c .> algparams.ρ_c_tol)
            subρ_c = @view algparams.ρ_c[increaseρ_c]
            subρ_c .= min.(subρ_c .+ 0.1algparams.maxρ_c, algparams.maxρ_c)
            subρ_c_tol = @view algparams.ρ_c_tol[(.!increaseρ_c) .& (viol_c .<= algparams.ρ_c_tol)]
            subρ_c_tol .= max.(subρ_c_tol./1.2, algparams.zero)
        end

        if modelinfo.time_link_constr_type == :corrective_inequality
            λ.ctgs_p .= max.(λ.ctgs_p .+ (algparams.θ*algparams.ρ_c.*link_constr[:ctgs_p]), 0)
            λ.ctgs_n .= max.(λ.ctgs_n .+ (algparams.θ*algparams.ρ_c.*link_constr[:ctgs_n]), 0)
        else
            λ.ctgs += algparams.θ*algparams.ρ_c.*link_constr[:ctgs]
        end

        maxviol_c = maximum(viol_c)
    end

    return maxviol_t, maxviol_c
end

end # module
