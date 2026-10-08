# Elk terrain pipeline (in progress)

A staged, repeatable GIS process for shortlisting promising elk country across Oregon hunt units. It is one component of First Light, a decision-training project for hunters who don't have a mentor and don't have much time in the field.

**Status:** early build. The water layer is written and tested on synthetic data. The terrain layers are in design. Nothing here is validated against real hunts yet, and outputs are scouting aids, not verdicts.

## The problem

A hunter with a week or less per season can't scout every drainage. Most of what experienced hunters know is pattern recognition: where water, north-facing slopes, benches and cover come together, and where hunting pressure is thin. Newer hunters rarely get that from a mentor. The question this project asks is whether public terrain data can narrow a large unit to a short list worth a closer look, and whether the list holds up against places the author has actually hunted.

## Design decisions

- **Staged layers, not one model.** Water, terrain, cover and access pressure are separate steps. Each can be checked on its own, and a bad result points to a specific layer.
- **Reproducible runs.** One config file, one script per layer. Every run writes a log of parameters, stage counts and validation results beside its outputs, so any result can be recreated or compared.
- **Held-out validation.** Parameters are tuned on one unit and judged on another. A known-bad location is included, so the method has to rule places out as well as in.
- **Best locations, not all of them.** The goal is a short ranked list. Recall across every possible spot isn't the target.
- **Private inputs.** Unit polygons, source data and personal location lists stay out of the repo.
- **Lean tooling.** Free public data, open-source libraries, and exports (KML/GPX) that work in the apps hunters already use.

## Layers

1. **Water (built):** cluster springs from NHD data with DBSCAN, within an elevation band, clipped to a unit polygon. A second pattern, springs along perennial stream length, is expected to be needed because some good country doesn't produce tight spring clusters.
2. **Terrain (planned):** USGS 3DEP 1/3 arc-second DEM reprojected to a metric CRS, then slope, aspect, a north-facing mask, and benches via large-window TPI.
3. **Cover and pressure (planned):** canopy cover and road distance, to separate remote country from places that are only quiet because of access.
4. **Ranking (planned):** similarity to known-good locations, checked against the known-bad one.

## What I'm learning

The first useful finding came from asking what "cluster size" meant. An older script hard-coded DBSCAN's `min_samples` and filtered afterward, which lets springs chain into long thin groups. The new script uses it as a density rule. They aren't the same, and the choice changes which places get flagged. Part of the validation step is finding out which one reproduces known results.

## Run (water layer)

    pip install shapely pyproj scikit-learn pyyaml
    python3 -I springs.py run   --unit <unit> --eps 500 --min-size 2
    python3 -I springs.py sweep --unit <unit>

Outputs: KML, GPX (for onX), CSV, and a JSON run log per run.

## Roadmap

- [x] Config-driven water layer with logged runs and known-location checks
- [ ] Validate on real units; record what passes and fails
- [ ] Fetch, clip and reproject DEM; slope, aspect, benches
- [ ] Canopy and road-distance layers
- [ ] Ranking against known-good and known-bad locations
- [ ] Publish code with an example config and synthetic test data

Code will be added once the first layer is validated.
