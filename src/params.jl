#
## Constant params
const MOI_OPTIMAL_STATUSES = [
    MOI.OPTIMAL,
    MOI.ALMOST_OPTIMAL,
    MOI.LOCALLY_SOLVED,
    MOI.ALMOST_LOCALLY_SOLVED,
]

@enum(TargetDevice,
    CPU,
    CUDADevice,
    Mixed,
)

#
#
# Algorithmic parameters
#
"""
    AlgParams

Specifies ProxAL's algorithmic parameters.

| Parameter | Description | Default value |
| :--- | :--- | :--- |
| `decompCtgs::Bool` | if true: decompose across contingencies (along with time) | false
| `jacobi::Bool` |     if true: do Jacobi updates, else do Gauss-Siedel updates | true
| `parallel::Bool` |   run NLP subproblems in parallel (needs MPI) | true
| `iterlim::Int` |     maximum number of ProxAL iterations | 100
| `nlpiterlim::Int` |  maximum number of NLP subproblem iterations | 100
| `tol::Float64` |     tolerance used for ProxAL termination | 1.0e-4
| `zero::Float64` |    tolerance below which is regarded as zero | 1.0e-8
| `θ_t::Float64` |     see [Formulation](@ref) | 1.0
| `θ_c::Float64` |     see [Formulation](@ref) | 1.0
| `ρ_t::Float64` |     AL parameter for ramp constraints | 1.0
| `ρ_c::Float64` |     AL parameter for ctgs constraints | 1.0
| `updateρ_t::Bool` |  if true: dynamically update `ρ_t` | false
| `updateρ_c::Bool` |  if true: dynamically update `ρ_c` | false
| `τ::Float64`       | Proximal weight parameter | 3.0
| `updateτ::Bool` |    if true: dynamically update `τ` | false
| `verbose::Int` |     level of output: 0 (none), 1 (stdout), 2 (+plots), 3 (+outfiles) | 0
| `mode::Symbol` |     computation mode `∈ [:nondecomposed, :coldstart, :lyapunov_bound]` | `:nondecomposed`
| `optimizer::Any` |   NLP solver | `nothing`
| `gpu_optimizer::Any` | GPU-compatible NLP solver | `nothing`
| `nr_tol::Float64`    | Tolerance of the Newton-Raphson algorithm (used only in `ReducedSpace()` model) | 1e-10
| `device::TargetDevice` | Target device to deport the resolution of the optimization problem | CPU
| `init_opt::Bool` |   if true: initialize block OPFs with base OPF solution | false
"""
mutable struct AlgParams
    decompCtgs::Bool# decompose contingencies (along with time)
    jacobi::Bool    # if true: do jacobi, else do gauss-siedel
    parallel::Bool  # run NLP subproblems in parallel
    iterlim::Int    # maximum number of ADMM iterations
    nlpiterlim::Int # maximum number of NLP subproblem iterations
    tol::Float64    # tolerance used for ADMM termination
    zero::Float64   # tolerance below which is regarded as zero
    θ_t::Float64    # weight_quadratic_penalty_time
    θ_c::Float64    # weight_quadratic_penalty_ctgs
    ρ_t::Float64    # AL parameter for ramp constraints
    ρ_c::Float64    # AL parameter for ctgs constraints
    updateρ_t::Bool # Dynamically update ρ for ramp constraints
    updateρ_c::Bool # Dynamically update ρ for ctgs constraints
    τ::Float64      # Proximal coefficient
    updateτ::Bool   # Dynamically update τ
    verbose::Int    # level of output: 0 (none), 1 (stdout), 2 (+plots), 3 (+outfiles)
    mode::Symbol    # computation mode [:nondecomposed, :coldstart, :lyapunov_bound]
    optimizer::Any  # NLP solver for fullmodel and subproblems
    gpu_optimizer::Any  # GPU-compatible NLP solver for fullmodel and subproblems
    nr_tol::Float64 # Tolerance of the Newton-Raphson algorithm used in resolution of ExaBlockModel backend
    device::TargetDevice
    init_opf::Bool  # initialize block OPFs with base OPF solution

    function AlgParams()
        new(
            false,  # decompCtgs
            true,   # jacobi
            true,   # parallel
            100,    # iterlim
            100,    # nlpiterlim
            1e-4,   # tol
            1e-8,   # zero
            1.0,    # θ_t
            1.0,    # θ_c
            1.0,    # ρ_t
            1.0,    # ρ_c
            false,  # updateρ_t
            false,  # updateρ_c
            3.0,    # τ
            false,  # updateτ
            0,      # verbose
            :nondecomposed, # mode
            nothing, # optimizer
            nothing, # GPU optimizer
            1e-10,   # nr_tol
            CPU,     # device
            false,   # init_opf
        )
    end
end

"""
    ModelParams

Specifies the ACOPF model structure.

| Parameter | Description | Default value |
| :--- | :--- | :--- |
| `num_time_periods::Int` | number of time periods | 1
| `num_ctgs::Int` | number of line contingencies | 0
| `load_scale::Float64` | load multiplication factor | 1.0
| `ramp_scale::Float64` | multiply this with ``p_{g}^{max}`` to get generator ramping ``r_g`` | 1.0
| `obj_scale::Float64` | objective multiplication factor | 1.0e-3
| `allow_obj_gencost::Bool` | model generator cost | true
| `allow_constr_infeas::Bool` | allow constraint infeasibility | false
| `weight_constr_infeas::Float64` | quadratic penalty weight for constraint infeasibilities | 1.0
| `weight_freq_ctrl::Float64` | quadratic penalty weight for frequency violations | 1.0
| `weight_ctgs::Float64` | linear weight of contingency objective function | 1.0
| `case_name::String` | name of case file | ""
| `savefile::String` | name of save file | ""
| `time_link_constr_type::Symbol` | `∈ [:penalty, :equality, :inequality]` see [Formulation](@ref) | `:penalty`
| `ctgs_link_constr_type::Symbol` | `∈ [:frequency_ctrl, :preventive_penalty, :preventive_equality, :corrective_penalty, :corrective_equality, :corrective_inequality]`, see [Formulation](@ref) | `:frequency_ctrl`
"""
mutable struct ModelParams
    num_time_periods::Int
    num_ctgs::Int
    load_scale::Float64
    ramp_scale::Float64
    obj_scale::Float64
    allow_obj_gencost::Bool
    allow_constr_infeas::Bool
    weight_constr_infeas::Float64
    weight_freq_ctrl::Float64
    weight_ctgs::Float64
    case_name::String
    savefile::String
    time_link_constr_type::Symbol
    ctgs_link_constr_type::Symbol
    


    function ModelParams()
        new(
            1,     # num_time_periods
            0,     # num_ctgs
            1.0,   # load_scale
            1.0,   # ramp_scale
            1e-3,  # obj_scale
            true,  # allow_obj_gencost
            false, # allow_constr_infeas
            1.0,   # weight_constr_infeas
            1.0,   # weight_freq_ctrl
            1.0,   # weight_ctgs
            "",    # case_name
            "",    # savefile
            :penalty,               # time_link_constr_type [:penalty,
                                    #                        :equality,
                                    #                        :inequality]
            :frequency_ctrl,        # ctgs_link_constr_type [:frequency_ctrl,
                                    #                        :preventive_penalty,
                                    #                        :preventive_equality,
                                    #                        :corrective_penalty,
                                    #                        :corrective_equality,
                                    #                        :corrective_inequality]
        )
    end
end
