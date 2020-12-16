using Pkg

Pkg.develop(PackageSpec(path=joinpath(dirname(@__FILE__), "..")))
# when first running instantiate
Pkg.instantiate()

using Documenter, ProxAL

makedocs(
    sitename = "ProxAL.jl",
    format = Documenter.HTML(
        prettyurls = Base.get(ENV, "CI", nothing) == "true",
        mathengine = Documenter.KaTeX()
    ),
    strict = true,
    pages = [
        "Home" => "index.md",
        "Manual" => [
            "Formulation" => "man/formulation.md",
            "Algorithm" => "man/algorithm.md",
            "Usage" => "man/usage.md",
        ],
        "Library" => [
            "Model parameters" => "lib/modelparams.md",
            "Algorithm parameters" => "lib/algparams.md",
            "Main functions" => "lib/algorithm.md",
            "Developer reference" => "lib/developer.md",
        ]
    ]
)

