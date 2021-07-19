using Test
using ProxAL
using DelimitedFiles, Printf
using LinearAlgebra, JuMP, Ipopt
using CatViews
using CUDA
using MPI

MPI.Init()
DATA_DIR = joinpath(dirname(@__FILE__), "..", "data")
case = "case9"
T = 2
K = 0
ramp_scale = 0.5
load_scale = 1.0
maxρ = 0.1
quad_penalty = 0.1
rtol = 1e-2

# Load case
case_file = joinpath(DATA_DIR, "$(case).m")
load_file = joinpath(DATA_DIR, "mp_demand", "$(case)_oneweek_168")
# ctgs_arr = deepcopy(rawdata.ctgs_arr)

# Model/formulation settings
modelinfo = ModelParams()
modelinfo.num_time_periods = T
modelinfo.load_scale = load_scale
modelinfo.ramp_scale = ramp_scale
modelinfo.allow_obj_gencost = true
modelinfo.allow_constr_infeas = false
modelinfo.time_link_constr_type = :penalty
modelinfo.ctgs_link_constr_type = :frequency_ctrl
modelinfo.case_name = case
modelinfo.num_ctgs = K

# Algorithm settings
algparams = AlgParams()
algparams.verbose = 0
algparams.init_opf = true
algparams.θ_t = quad_penalty
algparams.θ_c = quad_penalty
algparams.ρ_t = algparams.ρ_c = maxρ
algparams.τ = 3maxρ
algparams.decompCtgs = false

# For JuMP
algparams.optimizer = optimizer_with_attributes(
    Ipopt.Optimizer,
    "print_level" => Int64(algparams.verbose > 0)*5,
)
# For ExaPF
algparams.gpu_optimizer = optimizer_with_attributes(
    Ipopt.Optimizer,
    "print_level" => 0,
    "limited_memory_max_history" => 50,
    "hessian_approximation" => "limited-memory",
    "tol" => 1e-5,
)

optimal_obvalue = round(11.258316111585623, digits = 6)
optimal_pg = round.([0.8979870694509675, 1.3432060120295906, 0.9418738103137331, 0.9840203268625166, 1.448040098924617, 1.0149638876964715], digits = 5)
@testset "Test ProxAL on $(case) with $T-period, $K-ctgs, time_link=penalty and Ipopt" begin
    algparams.mode = :coldstart
    nlp = ProxALEvaluator(case_file, load_file, modelinfo, algparams, ProxAL.JuMPBackend())
    info = ProxAL.optimize!(nlp)
    @test isapprox(info.objvalue[end], optimal_obvalue, rtol = rtol)
    @test isapprox(info.x.Pg[:], optimal_pg, rtol = rtol)
    @test norm(info.x.Zt[:], Inf) <= 1e-4
    @test info.maxviol_t[end] <= algparams.tol
    @test info.maxviol_d[end] <= algparams.tol
    @test info.iter <= algparams.iterlim
end
MPI.Finalize()
