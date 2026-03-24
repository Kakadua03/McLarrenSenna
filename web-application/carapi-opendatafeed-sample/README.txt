This zip archive contains v1 and v2 data. New applications should use the v2 data.

V2 Data [recommended]
- The XLS (v2-carapi-datafeed-sample.xlsx) contains all the data the v2 API does minus exterior and interior colors. The
XLS is broken up into several sheets: makes, models, submodels, trims, engines, bodies and mileages.
- The sheets in the XLS can also be found in individual CSVs (i.e. makes.csv, engines.csv etc).

V1 Data [deprecated / legacy / discouraged]
- The legacy CSV (v1-legacy-carapi-datafeed-sample.csv) contains all v1 data. While much is the same as v2, the legacy file does not
have submodels and there are some differences with model namings. While the v1 data feed will continue
being updated for the foreseeable future, new development will not be taking place on V1 APIs or datasets.
Applications based off the v1 dataset should move to v2 data. New users should AVOID using V1 data entirely.
