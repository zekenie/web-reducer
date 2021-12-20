#!/usr/bin/env zx

import "zx/globals";
import lodash from "lodash";

const allSamples = await globby("**/samples/**/*.json");

const file = lodash.sample(allSamples);

await $`cat ${file}`.pipe(process.stdout);
