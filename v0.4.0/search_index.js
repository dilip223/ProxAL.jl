var documenterSearchIndex = {"docs":
[{"location":"lib/opf/","page":"Optimal Power Flow","title":"Optimal Power Flow","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/opf/#Optimal-Power-Flow","page":"Optimal Power Flow","title":"Optimal Power Flow","text":"","category":"section"},{"location":"lib/opf/#Data-parsing","page":"Optimal Power Flow","title":"Data parsing","text":"","category":"section"},{"location":"lib/opf/","page":"Optimal Power Flow","title":"Optimal Power Flow","text":"parse_file\nRawData\nopf_loaddata","category":"page"},{"location":"lib/opf/#ProxAL.parse_file","page":"Optimal Power Flow","title":"ProxAL.parse_file","text":"parse_file(datafile::String)\n\nParse MATPOWER or PSSE instances using ExaPF's parsers. Return full dataset as Dict{String, Array{Float64, 2}, with entries\n\n\"bus\": specifications for all buses in the network\n\"branch\": specifications for all branches in the network\n\"gen\": specifications for all generators in the network\n\"costs\": costs coefficients.\n\"baseMVA\": baseMVA of the network\n\n\n\n\n\n","category":"function"},{"location":"lib/opf/#ProxAL.RawData","page":"Optimal Power Flow","title":"ProxAL.RawData","text":"RawData\n\nSpecifies the ACOPF instance data.\n\nbaseMVA: imported with ExaPF parser\nbus_arr: imported with ExaPF parser\nbranch_arr: imported with ExaPF parser\ngen_arr: imported with ExaPF parser\ncostgen_arr: imported with ExaPF parser\npd_arr: read from .Pd file\nqd_arr: read from .Qd file\nctgs_arr: read from .Ctgs file\n\n\n\n\n\n","category":"type"},{"location":"lib/opf/#ProxAL.opf_loaddata","page":"Optimal Power Flow","title":"ProxAL.opf_loaddata","text":"opf_loaddata(\n    raw::RawData;\n    time_horizon_start::Int=1,\n    time_horizon_end::Int=0,\n    load_scale::Float64=1.0,\n    ramp_scale::Float64=0.0,\n    corr_scale::Float64=0.1,\n    lineOff=Line()\n)\n\nLoads the multi-period ACOPF instance data from raw with the time horizon defined to be [time_horizon_start,  time_horizon_end]. Note that time_horizon_end = 0 indicates as many as possible (the number of columns in raw.pd_arr).\n\nAll loads in all time periods will be multiplied by load_scale. The ramp_scale is the factor which multiplies p_g^max to get generator ramping r_g. The corr_scale is the factor which multiplies r_g to get generator ramping for corrective control. These are set in ModelInfo.  See Model parameters.\n\nlineOff is a transmission line that can be deleted to represent a contingency.\n\n\n\n\n\n","category":"function"},{"location":"man/formulation/#Formulation","page":"Formulation","title":"Formulation","text":"","category":"section"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"Currently, ProxAL is designed to solve contingency-constrained AC Optimal Power Flow (ACOPF) formulations over multiple time periods. ","category":"page"},{"location":"man/formulation/#Time-coupling","page":"Formulation","title":"Time coupling","text":"","category":"section"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"Each time period t in T involves the solution of an ACOPF with active p_dt and reactive q_dt load forecasts, which may differ from one time period to the next. In each time period t in T, we must determine the 'base-case' active power generation level of generator g in G, denoted by p^0_gt. The active power generations in consecutive time periods are constrained by the generator's ramping capacity, which can be modeled as follows:","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"-r_g leq p^0_gt-1 - p^0_gt leq r_g qquad forall g in G  forall t in T setminus 1","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"Here, r_g denotes the ramping capacity of generator g (per unit of time in which T is defined).","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"For convenience, ProxAL also provides the functionality to solve the full/\"non-decomposed\" model using JuMP/Ipopt. In this case, one can switch between the above inequality form, or an equivalent equality form, as well as a quadratic penalty form of the ramping constraint by setting the time_link_constr_type field of ProxAL.ModelParams in Model parameters. When solving the full/\"non-decomposed\" model with the quadratic penalty form of the ramping constraints, the user must provide a value for the corresponding quadratic penalty parameter by setting θ_t in Algorithm parameters.","category":"page"},{"location":"man/formulation/#Contingency-constraints","page":"Formulation","title":"Contingency constraints","text":"","category":"section"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"Each single-period ACOPF problem may itself be constrained further by a set of transmission line contingencies, denoted by K. The active and reactive power generations, and bus voltages must satisfy the following constraints in each time period and each contingency:","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"the power flow equations, \nbounds on active and reactive generation and voltage magnitudes, and \nline power flow limits.","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"note: Note\nIt is possible that the problem parameters are such that (some of) the above constraints can become infeasible. To model this, ProxAL also allows constraint infeasibility (except on variable bounds) by penalizing them in the objective function with a quadratic penalty. This can be controlled by setting allow_constr_infeas = true and a corresponding value for weight_constr_infeas in Model parameters.","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"note: Note\nLine power flow limits can be disabled by setting allow_line_limits = false.","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"The contingencies in each time period are linked together via their active power generations in one of several forms. The choice of the form can be set using the ctgs_link_constr_type field of ProxAL.ModelParams in Model parameters.","category":"page"},{"location":"man/formulation/","page":"Formulation","title":"Formulation","text":"Preventive mode: active power generation in contingency k must be equal to the base case value. This constraint has one of two forms:  \nPreventive equality: This is the original form of the constraint. For numerical convergence reasons, ProxAL does not allow using this form whenever the decompCtgs field of ProxAL.AlgParams is set to true,  see Algorithm parameters.\np_gt^k = p_gt^0 qquad forall g in G  forall k in K  forall t in T\nPreventive penalty: In this form, ProxAL introduces additional continuous variables z_gkt along with the following constraints. Note that a quadratic penalty term θ_c z_k ^2 is also added to the objective function, where the parameter θ_c is controlled within ProxAL whenever the decompCtgs field of ProxAL.AlgParams is set to true. Otherwise, its value can be set using the θ_c field of ProxAL.AlgParams in Algorithm parameters.\np_gt^k = p_gt^0 + z_gkt qquad forall g in G  forall k in K  forall t in T\nCorrective mode: active power generation is allowed to deviate from base case by up to Delta fraction of its ramping capacity. The parameter Delta can be set using the corr_scale field of ProxAL.ModelParams in Model parameters. This constraint has one of two forms:   \nCorrective inequality: This is the original form of the constraint. For numerical convergence reasons, ProxAL does not allow using this form whenever the decompCtgs field of ProxAL.AlgParams is set to true, see Algorithm parameters.\n01 r_g leq p_gt^k - p_gt^0 leq Delta  r_g qquad forall g in G  forall k in K  forall t in T\nCorrective equality: In this form, ProxAL introduces additional continuous variables s_gkt along with the following constraints. As before, ProxAL does not allow using this form whenever the decompCtgs field of ProxAL.AlgParams is set to true.\nleftbeginaligned\n  0 leq s_gkt leq 2 Delta  r_g  \n  p_gt^0 - p_gt^k + s_gkt = Delta  r_g \n  endalignedright qquad forall g in G  forall k in K  forall t in T\nCorrective penalty: In this form, ProxAL introduces additional continuous variables s_gkt and z_gkt along with the following constraints. A quadratic penalty term θ_c z_k  ^2 is also added to the objective function, where the parameter θ_c is controlled within ProxAL whenever the decompCtgs field of ProxAL.AlgParams is set to true. Otherwise, its value can be set using the θ_c field of ProxAL.AlgParams in Algorithm parameters.\nleftbeginaligned\n    0 leq s_gkt leq 2 Delta  r_g  \n    p_gt^0 - p_gt^k + s_gkt + z_gkt = Delta  r_g\nendalignedright qquad forall g in G  forall k in K  forall t in T\nFrequency control mode: In this case, ProxAL defines new continuous variables omega_kt which is the (deviation from nominal) system frequency in contingency k of time period t, and alpha_g is the droop control parameter of generator g. The objective functions includes an additional term w_omega  omega ^2, where the parameter w_omega must be set using the weight_freq_ctrl field of ProxAL.ModelParams in Model parameters. This constraint has one of two forms:  \nFrequency equality: This is the original form of the constraint. For numerical convergence reasons, ProxAL does not allow using this form whenever the decompCtgs field of ProxAL.AlgParams is set to true,  see Algorithm parameters.\np_gt^k = p_gt^0 + alpha_g omega_kt qquad forall g in G  forall k in K  forall t in T\nFrequency penalty: In this form, ProxAL introduces additional continuous variables z_gkt along with the following constraints. Note that a quadratic penalty term θ_c z_k ^2 is also added to the objective function, where the parameter θ_c is controlled within ProxAL whenever the decompCtgs field of ProxAL.AlgParams is set to true. Otherwise, its value can be set using the θ_c field of ProxAL.AlgParams in Algorithm parameters.\np_gt^k = p_gt^0 + alpha_g omega_kt + z_gkt qquad forall g in G  forall k in K  forall t in T","category":"page"},{"location":"man/algorithm/#Algorithm","page":"Algorithm","title":"Algorithm","text":"","category":"section"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"The Formulation is decomposed into smaller optimization blocks. Specifically, ProxAL.jl supports decomposition into:","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"single-period multiple-contingency ACOPF problems, and \nsingle-period single-contingency ACOPF problems.","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"This decomposition is achieved by formulating an Augmented Lagrangian with respect to the coupling constraints: in decomposition mode 1, these are the ramping constraints; and in mode 2, these are the ramping as well as contingency-linking constraints.","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"The decomposed formulation is solved using an iterative ADMM-like Jacobi scheme with proximal terms, by updating first the primal variables (e.g., power generations and voltages) and then the dual variables of the coupling constraints. The Jacobi nature of the update implies that the single-block nonlinear programming (NLP) problems can be solved in parallel. ProxAL.jl allows the parallel solution of these NLP block subproblems using the MPI.jl package.","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"The single-block NLP problems can be solved using one of three backends (see NLP blocks and backends for details):","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"JuMP to solve the ACOPF in full-space (with a user-provided NLP solver)\nExaTron to solve the ACOPF using component-based decomposition\nExaPF to solve the ACOPF in reduced-space","category":"page"},{"location":"man/algorithm/","page":"Algorithm","title":"Algorithm","text":"Further details about the algorithm can be found in the preprint.","category":"page"},{"location":"lib/algparams/","page":"Algorithm parameters","title":"Algorithm parameters","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/algparams/#Algorithm-parameters","page":"Algorithm parameters","title":"Algorithm parameters","text":"","category":"section"},{"location":"lib/algparams/#Description","page":"Algorithm parameters","title":"Description","text":"","category":"section"},{"location":"lib/algparams/","page":"Algorithm parameters","title":"Algorithm parameters","text":"AlgParams","category":"page"},{"location":"lib/algparams/#ProxAL.AlgParams","page":"Algorithm parameters","title":"ProxAL.AlgParams","text":"AlgParams\n\nSpecifies ProxAL's algorithmic parameters.\n\nParameter Description Default value\ndecompCtgs::Bool if true: decompose across contingencies (along with time) false\njacobi::Bool if true: do Jacobi updates, else do Gauss-Siedel updates true\niterlim::Int maximum number of ProxAL iterations 100\nnlpiterlim::Int maximum number of NLP subproblem iterations 100\ntol::Float64 tolerance used for ProxAL termination 1.0e-4\nzero::Float64 tolerance below which is regarded as zero 1.0e-8\nθ_t::Float64 see Formulation 1.0\nθ_c::Float64 see Formulation 1.0\nρ_t::Float64 AL penalty weight for ramp constraints 1.0\nρ_c::Float64 AL penalty weight for ctgs constraints 1.0\nupdateρ_t::Bool if true: dynamically update ρ_t true\nupdateρ_c::Bool if true: dynamically update ρ_c true\nτ::Float64 Proximal weight parameter 3.0\nupdateτ::Bool if true: dynamically update τ true\nverbose::Int level of output: 0 (none), 1 (stdout) 0\nmode::Symbol computation mode ∈ [:nondecomposed, :coldstart, :lyapunov_bound] :coldstart\noptimizer::Any NLP solver nothing\ngpu_optimizer::Any GPU-compatible NLP solver nothing\nnr_tol::Float64 Tolerance of the Newton-Raphson algorithm (used only in ExaPFBackend() model) 1e-10\ninit_opt::Bool if true: initialize block OPFs with base OPF solution false\ndevice::TargetDevice Target device to deport the resolution of the optimization problem CPU\nverbose_inner::Int Verbose level for ExaTronBackend() 0\ntron_rho_pq::Float64 Parameter for ExaTronBackend() 4e2\ntron_rho_pa::Float64 Parameter for ExaTronBackend() 4e4\ntron_scale::Float64 Parameter for ExaTronBackend() 1e-4\ntron_inner_iterlim::Int Parameter for ExaTronBackend() 800\ntron_outer_iterlim::Int Parameter for ExaTronBackend() 20\ntron_outer_eps::Float64 Parameter for ExaTronBackend() 1e-4\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/backends/#NLP-blocks-and-backends","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"","category":"section"},{"location":"lib/backends/#NLP-Blocks","page":"NLP blocks and backends","title":"NLP Blocks","text":"","category":"section"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"The Formulation is decomposed into smaller nonlinear programming (NLP) blocks. Blocks are coupled together using a OPFBlocks structure.","category":"page"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"OPFBlocks","category":"page"},{"location":"lib/backends/#ProxAL.OPFBlocks","page":"NLP blocks and backends","title":"ProxAL.OPFBlocks","text":"OPFBlocks(\n    opfdata::OPFData,\n    rawdata::RawData;\n    modelinfo::ModelInfo = ModelInfo(),\n    backend=JuMPBlockBackend,\n    algparams::AlgParams = AlgParams()\n)\n\nCreate a structure OPFBlocks to decompose the original OPF problem specified in opfdata timestep by timestep, by dualizing the ramping constraint. One block corresponds to one optimization subproblem (and hence, to a particular timestep), and the attribute blkCount enumerates the total number of subproblems. The subproblems are specified using AbstractBlockModel objects, allowing to define them either with JuMP (if backend=JuMPBlockBackend is chosen) or with ExaPF (backend=ExaBlockBackend).\n\nDecomposition by contingencies\n\nBy default, OPFBlocks decomposes the problem only timestep by timestep (single-period multiple-contingency scheme), leading to a total of T subproblems. However, if the option algparams.decompCtgs is set to true, the original problem is also decomposed contingency by contingency (single-period single-contingency scheme). In this case the total number of subproblems is T * K (with K the total number of contingencies).\n\nDeporting the resolution on the GPU\n\nWhen the backend is set to ExaBlockBackend (and a CUDA GPU is available), the user could chose to deport the resolution of each subproblem directly on the GPU simply by setting algparams.device=CUDADevice. However, note that we could not instantiate more subproblems on the GPU than the number of GPU available.\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"Internally, each block is represented as follows.","category":"page"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"AbstractBlockModel\ninit!\nadd_variables!\nset_objective!\noptimize!\nset_start_values!\nget_solution\n","category":"page"},{"location":"lib/backends/#ProxAL.AbstractBlockModel","page":"NLP blocks and backends","title":"ProxAL.AbstractBlockModel","text":"AbstractBlockModel\n\nAbstract supertype for the definition of block subproblems.\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#ProxAL.init!","page":"NLP blocks and backends","title":"ProxAL.init!","text":"init!(block::AbstractBlockModel, algparams::AlgParams)\n\nInitialize the optimization model by populating the model with variables and constraints.\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#ProxAL.add_variables!","page":"NLP blocks and backends","title":"ProxAL.add_variables!","text":"add_variables!(block::AbstractBlockModel, algparams::AlgParams)\n\nAdd all optimization variables into the decomposed optimization model block.\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#ProxAL.set_objective!","page":"NLP blocks and backends","title":"ProxAL.set_objective!","text":"set_objective!(\n    block::AbstractBlockModel,\n    algparams::AlgParams,\n    primal::AbstractPrimalSolution,\n    dual::AbstractDualSolution\n)\n\nUpdate the objective inside block's optimization subproblem. The new objective updates the coefficients of the penalty terms with respect to the reference primal and dual solutions passed in the arguments.\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#ProxAL.optimize!","page":"NLP blocks and backends","title":"ProxAL.optimize!","text":"optimize!(block::AbstractBlockModel, x0::AbstractArray, algparams::AlgParams)\n\nSolve the optimization problem, starting from an initial point x0. The optimization solver is specified in field algparams.optimizer.\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#ProxAL.set_start_values!","page":"NLP blocks and backends","title":"ProxAL.set_start_values!","text":"set_start_values!(block::AbstractBlockModel, x0::AbstractArray)\n\nSet x0 as the initial point for the optimization of model block.\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#ProxAL.get_solution","page":"NLP blocks and backends","title":"ProxAL.get_solution","text":"get_solution(block::AbstractBlockModel, output)\n\nReturn the solution of the optimization as a named tuple solution, with fields\n\nstatus::MOI.TerminationStatus: final status returned by the solver\nminimum::Float64: optimal objective found\nvm::AbstractArray: optimal values of voltage magnitudes\nva::AbstractArray: optimal values of voltage angles\npg::AbstractArray: optimal values of active power generations\nqg::AbstractArray: optimal values of reactive power generations\nωt::AbstractArray: optimal values of frequency variable\nst::AbstractArray: optimal values of slack variables for ramping\nsk::AbstractArray: optimal values of slack variables for contingencies (OPTIONAL)\nzk::AbstractArray: optimal values of penalty variables for contingencies (OPTIONAL)\n\n\n\n\n\n","category":"function"},{"location":"lib/backends/#Backends","page":"NLP blocks and backends","title":"Backends","text":"","category":"section"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"JuMPBackend\nJuMPBlockBackend\nExaTronBackend\nTronBlockBackend\nExaPFBackend\n","category":"page"},{"location":"lib/backends/#ProxAL.JuMPBackend","page":"NLP blocks and backends","title":"ProxAL.JuMPBackend","text":"JuMPBackend <: AbstractBackend\n\nSolve OPF in full-space with JuMP/MOI.\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#ProxAL.JuMPBlockBackend","page":"NLP blocks and backends","title":"ProxAL.JuMPBlockBackend","text":"JuMPBlockBackend(\n    blk::Int,\n    opfdata::OPFData,\n    raw_data::RawData,\n    algparams::AlgParams,\n    modelinfo::ModelInfo,\n    t::Int, k::Int, T::Int,\n)\n\nUse the JuMP backend to define the optimal power flow inside the block model. This function is called inside the constructor of the structure OPFBlocks.\n\nArguments\n\nblk::Int: ID of the block represented by this model\nopfdata::OPFData: data used to build the optimal power flow problem.\nraw_data::RawData: same data, in raw format\nalgparams::AlgParams: algorithm parameters\nmodelinfo::ModelInfo: model parameters\nt::Int: current time period index. Value should be between 1 and T.\nk::Int: current contingency index\nT::Int: final time period index\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#ProxAL.ExaTronBackend","page":"NLP blocks and backends","title":"ProxAL.ExaTronBackend","text":"ExaTronBackend <: AbstractBackend\n\nSolve OPF by decomposition using ExaTron.\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#ProxAL.TronBlockBackend","page":"NLP blocks and backends","title":"ProxAL.TronBlockBackend","text":"TronBlockBackend(\n    blk::Int,\n    opfdata::OPFData,\n    raw_data::RawData,\n    algparams::AlgParams,\n    modelinfo::ModelInfo,\n    t::Int, k::Int, T::Int;\n)\n\nArguments\n\nblk::Int: ID of the block represented by this model\nopfdata::OPFData: data used to build the optimal power flow problem.\nraw_data::RawData: same data, in raw format\nalgparams::AlgParams: algorithm parameters\nmodelinfo::ModelInfo: model parameters\nt::Int: current time period index. Value should be between 1 and T.\nk::Int: current contingency index\nT::Int: final time period index\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#ProxAL.ExaPFBackend","page":"NLP blocks and backends","title":"ProxAL.ExaPFBackend","text":"ExaPFBackend <: AbstractBackend\n\nSolve OPF in reduced-space with ExaPF.\n\n\n\n\n\n","category":"type"},{"location":"lib/backends/#OPF","page":"NLP blocks and backends","title":"OPF","text":"","category":"section"},{"location":"lib/backends/","page":"NLP blocks and backends","title":"NLP blocks and backends","text":"opf_block_get_auglag_penalty_expr","category":"page"},{"location":"lib/backends/#ProxAL.opf_block_get_auglag_penalty_expr","page":"NLP blocks and backends","title":"ProxAL.opf_block_get_auglag_penalty_expr","text":"opf_block_get_auglag_penalty_expr(\n    opfmodel::JuMP.Model,\n    modelinfo::ModelInfo,\n    opfdata::OPFData,\n    k::Int, t::Int,\n    algparams::AlgParams,\n    primal::OPFPrimalSolution,\n    dual::OPFDualSolution\n)\n\nLet k and t denote the contingency number and time period of the NLP block. Then, depending on algparams.decompCtgs, this function must return an appropriate expression.\n\nWe use mathbbI to denote the indicator function. Also, unless otherwise indicated, \n\nz_g are parameters and must be taken from primal.Zt\np_g and s_g variables that are not indexed with t   are parameters and must be taken from primal.Pg and primal.St\nlambda (without k subscript) must be taken from dual.ramping\nrho_t must be taken from algparams.ρ_t\ntau must be taken from algparams.τ\nIf algparams.decompCtgs == false, then this function must return:\n\nbeginaligned\nsum_g in G Bigg\n 05tau p^0_gt - mathrmprimalp^0_gt^2 \n+mathbbIt  1Big(\nlambda_gtp^0_gt-1 - p^0_gt + s_gt + z_gt - r_g +\n05rho_tp^0_gt-1 - p^0_gt + s_gt + z_gt - r_g^2\nBig) \n+mathbbIt  TBig(\nlambda_gt+1p^0_gt - p^0_gt+1 + s_gt+1 + z_gt+1 - r_g +\n05rho_tp^0_gt - p^0_gt+1 + s_gt+1 + z_gt+1 - r_g^2\nBig) Bigg\nendaligned\n\nIf algparams.decompCtgs == true, then this function must return:\n\n(to do)\n\n\n\n\n\n","category":"function"},{"location":"lib/mpi/","page":"MPI communication","title":"MPI communication","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/mpi/#MPI-communication","page":"MPI communication","title":"MPI communication","text":"","category":"section"},{"location":"lib/mpi/#API-reference","page":"MPI communication","title":"API reference","text":"","category":"section"},{"location":"lib/mpi/","page":"MPI communication","title":"MPI communication","text":"Modules = [ProxAL]\nPages = [\"src/communication.jl\"]","category":"page"},{"location":"lib/mpi/#ProxAL.comm_max-Tuple{Float64, MPI.Comm}","page":"MPI communication","title":"ProxAL.comm_max","text":"comm_max(data, comm)\n\nCollective to reduce and return the maximum over scalar data.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.comm_neighbors!-Union{Tuple{T}, Tuple{AbstractMatrix{T}, ProxAL.AbstractBlocks, ProxAL.ProxALProblem, ProxAL.AbstractCommPattern, MPI.Comm}} where T","page":"MPI communication","title":"ProxAL.comm_neighbors!","text":"comm_neighbors!(data, blocks, runinfo, pattern, comm)\n\nNonblocking communication with a given pattern. An array of requests is returned.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.comm_sum!-Tuple{AbstractArray, MPI.Comm}","page":"MPI communication","title":"ProxAL.comm_sum!","text":"comm_sum!(data, comm)\n\nCollective to reduce the sum over array data.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.comm_sum-Tuple{Float64, MPI.Comm}","page":"MPI communication","title":"ProxAL.comm_sum","text":"comm_sum(data::Float64, comm)\n\nCollective to reduce and return the sum over scalar data.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.comm_wait!-Tuple{Vector{MPI.Request}}","page":"MPI communication","title":"ProxAL.comm_wait!","text":"comm_wait!(requests)\n\nWait until the communciation requests requests have been fulfilled.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.is_comm_pattern-Tuple{Any, Any, Any, Any, ProxAL.CommPatternTK}","page":"MPI communication","title":"ProxAL.is_comm_pattern","text":"is_comm_pattern(t, tn, k, kn, pattern)\n\nDo period t, tn and contingencies k, kn match the communication pattern?\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.is_my_work-Tuple{Any, MPI.Comm}","page":"MPI communication","title":"ProxAL.is_my_work","text":"is_my_work(blk, comm)\n\nReturns a boolean whether the block blk is assigned to this rank.\n\n\n\n\n\n","category":"method"},{"location":"lib/mpi/#ProxAL.whoswork-Tuple{Any, MPI.Comm}","page":"MPI communication","title":"ProxAL.whoswork","text":"whoswork(blk, comm)\n\nTo which rank is block blk currently assigned to.\n\n\n\n\n\n","category":"method"},{"location":"lib/algorithm/","page":"Main functions","title":"Main functions","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/algorithm/#Main-functions","page":"Main functions","title":"Main functions","text":"","category":"section"},{"location":"lib/algorithm/#API-Reference","page":"Main functions","title":"API Reference","text":"","category":"section"},{"location":"lib/algorithm/","page":"Main functions","title":"Main functions","text":"ProxALEvaluator\nNonDecomposedModel\noptimize!(::ProxALEvaluator)\noptimize!(::NonDecomposedModel)","category":"page"},{"location":"lib/algorithm/#ProxAL.ProxALEvaluator","page":"Main functions","title":"ProxAL.ProxALEvaluator","text":"ProxALEvaluator(\n    case_file::String,\n    load_file::String,\n    modelinfo::ModelInfo,\n    algparams::AlgParams,\n    space::AbstractBackend = JuMPBackend(),\n    comm::Union{MPI.Comm,Nothing} = MPI.COMM_WORLD\n)\n\nInstantiate multi-period ACOPF specified in case_file with loads in load_file with model parameters modelinfo, algorithm parameters algparams, modeling backend space, and a MPI communicator comm.\n\n\n\n\n\n","category":"type"},{"location":"lib/algorithm/#ProxAL.NonDecomposedModel","page":"Main functions","title":"ProxAL.NonDecomposedModel","text":"NonDecomposedModel(\n    case_file::String,\n    load_file::String,\n    modelinfo::ModelInfo,\n    algparams::AlgParams,\n    space::AbstractBackend=JuMPBackend(),\n    time_horizon_start = 1,\n)\n\nInstantiate non-decomposed multi-period ACOPF instance specified in case_file with loads in load_file with model parameters modelinfo and algorithm parameters algparams. The problem is defined over the horizon [time_horizon_start, modelinfo.num_time_periods]\n\n\n\n\n\n","category":"type"},{"location":"lib/algorithm/#ProxAL.optimize!-Tuple{ProxALEvaluator}","page":"Main functions","title":"ProxAL.optimize!","text":"optimize!(nlp::ProxALEvaluator)\n\nSolve problem using the nlp evaluator of the decomposition algorithm.\n\n\n\n\n\n","category":"method"},{"location":"lib/algorithm/#ProxAL.optimize!-Tuple{NonDecomposedModel}","page":"Main functions","title":"ProxAL.optimize!","text":"optimize!(nlp::NonDecomposedModel)\n\nSolve problem using the nlp evaluator of the nondecomposed model.\n\n\n\n\n\n","category":"method"},{"location":"man/usage/#Usage","page":"Usage","title":"Usage","text":"","category":"section"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"ProxAL.jl can be called from existing Julia code or REPL. The package is under heavy development and relies on non-registered Julia packages and versions. This requires to install packages via:","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"$ git clone https://github.com/exanauts/ProxAL.jl.git\n$ cd ProxAL.jl\n$ julia --project deps/deps.jl","category":"page"},{"location":"man/usage/#Example","page":"Usage","title":"Example","text":"","category":"section"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"We can set up and solve a problem as follows. For a full list of model and algorithmic options, see Model parameters and Algorithm parameters.","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"Consider the following example.jl using the JuMP backend, Ipopt solver, and using MPI:","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"using ProxAL\nusing JuMP, Ipopt\nusing MPI\nusing LazyArtifacts\n\nMPI.Init()\n\n# Model/formulation settings\nmodelinfo = ModelParams()\nmodelinfo.num_time_periods = 10\nmodelinfo.num_ctgs = 0\nmodelinfo.allow_line_limits = false\n\n# Load case in MATPOWER format\n# This automatically loads data from https://github.com/exanauts/ExaData\n# You may also provide your own case data\ncase_file = joinpath(artifact\"ExaData\", \"ExaData\", \"case118.m\")\nload_file = joinpath(artifact\"ExaData\", \"ExaData\", \"mp_demand\", \"case118_oneweek_168\")\n\n# Choose the backend\nbackend = ProxAL.JuMPBackend()\n\n# Algorithm settings\nalgparams = AlgParams()\nalgparams.verbose = 1\nalgparams.optimizer = JuMP.optimizer_with_attributes(Ipopt.Optimizer, \"print_level\" => 0)\nalgparams.tol = 1e-3 # tolerance for convergence\n\n# Solve the problem\nnlp = ProxALEvaluator(case_file, load_file, modelinfo, algparams, backend, MPI.COMM_WORLD)\nruninfo = ProxAL.optimize!(nlp)\n\n@show(runinfo.iter)                  # number of iterations\n@show(runinfo.maxviol_t_actual[end]) # ramping violation at last iteration\n@show(runinfo.maxviol_d[end])        # dual residual at last iteration\n\nMPI.Finalize()","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"To execute this file with 2 MPI processes:","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"$ mpiexec -n 2 julia --project example.jl","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"To disable MPI, simply pass nothing as the last argument to ProxALEvaluator (or omit the argument entirely) and you can simply run:","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"$ julia --project example.jl","category":"page"},{"location":"man/usage/","page":"Usage","title":"Usage","text":"An example using the ExaTron backend with ProxAL.CUDADevice (GPU) can be found in examples/exatron.jl.","category":"page"},{"location":"#ProxAL","page":"Home","title":"ProxAL","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"ProxAL.jl is a Julia package to solve linearly coupled block-structured nonlinear programming problems. In its current version, ProxAL can only solve multi-period contingency-constrained AC Optimal Power Flow (ACOPF) problems. Its main feature is a distributed parallel implementation, which allows running on high-performance computing architectures. ","category":"page"},{"location":"","page":"Home","title":"Home","text":"This document describes the algorithm, API and main functions of ProxAL.jl.","category":"page"},{"location":"#Table-of-contents","page":"Home","title":"Table of contents","text":"","category":"section"},{"location":"#Manual","page":"Home","title":"Manual","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Pages = [\n    \"man/formulation.md\",\n    \"man/algorithm.md\",\n    \"man/usage.md\",\n]\nDepth = 1","category":"page"},{"location":"#Library","page":"Home","title":"Library","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Pages = [\n    \"lib/modelparams.md\",\n    \"lib/algparams.md\",\n    \"lib/algorithm.md\",\n    \"lib/backends.md\",\n    \"lib/opf.md\",\n    \"lib/mpi.md\",\n]\nDepth = 1","category":"page"},{"location":"#Funding","page":"Home","title":"Funding","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"This research was supported by the Exascale Computing Project, a joint project of the U.S. Department of Energy’s Office of Science and National Nuclear Security Administration.","category":"page"},{"location":"lib/modelparams/","page":"Model parameters","title":"Model parameters","text":"CurrentModule = ProxAL","category":"page"},{"location":"lib/modelparams/#Model-parameters","page":"Model parameters","title":"Model parameters","text":"","category":"section"},{"location":"lib/modelparams/#Description","page":"Model parameters","title":"Description","text":"","category":"section"},{"location":"lib/modelparams/","page":"Model parameters","title":"Model parameters","text":"ModelInfo","category":"page"},{"location":"lib/modelparams/#ProxAL.ModelInfo","page":"Model parameters","title":"ProxAL.ModelInfo","text":"ModelInfo\n\nSpecifies the ACOPF model structure.\n\nParameter Description Default value\nnum_time_periods::Int number of time periods 1\nnum_ctgs::Int number of line contingencies 0\nload_scale::Float64 load multiplication factor 1.0\nramp_scale::Float64 multiply this with p_g^max to get generator ramping r_g 1.0\ncorr_scale::Float64 multiply this with r_g to get generator ramping for corrective control 0.1\nobj_scale::Float64 objective multiplication factor 1.0e-3\nallow_obj_gencost::Bool model generator cost true\nallow_constr_infeas::Bool allow constraint infeasibility false\nallow_line_limits::Bool allow line flow limits true\nweight_constr_infeas::Float64 quadratic penalty weight for constraint infeasibilities 1.0\nweight_freq_ctrl::Float64 quadratic penalty weight for frequency violations 1.0\nweight_ctgs::Float64 linear weight of contingency objective function 1.0\ncase_name::String name of case file \"\"\nsavefile::String name of save file \"\"\ntime_link_constr_type::Symbol ∈ [:penalty, :equality, :inequality] see Formulation :penalty\nctgs_link_constr_type::Symbol ∈ [:frequency_penalty, :frequency_equality, :preventive_penalty, :preventive_equality, :corrective_penalty, :corrective_equality, :corrective_inequality], see Formulation :frequency_penalty\n\n\n\n\n\n","category":"type"}]
}
