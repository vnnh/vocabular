//deno run --allow-all main.ts

import { config } from "https://deno.land/x/dotenv/mod.ts";
import { SenseTuple, ThesaurusResponse } from "./api.d.ts";

const env = config();

const list = Deno.readTextFileSync("list.txt").split("\n");

const map = new Map([
	["n", "noun"],
	["v", "verb"],
	["adj", "adjective"],
]);

for (const [i, v] of list.entries()) {
	const word = v.match(/^(\w+)/)?.[1];
	if (!word) {
		console.log(`\u001b[31mWord not found in line '${v}'\u001b[0m`);
		continue;
	}

	const partOfSpeechIdentifier = v.match(/\((\w+)/)?.[1];
	if (!partOfSpeechIdentifier) {
		console.log(`\u001b[31mPart of speech not found in line '${v}'\u001b[0m`);
		continue;
	}

	const partOfSpeech = map.get(partOfSpeechIdentifier) ?? partOfSpeechIdentifier;

	const res = await fetch(
		`https://www.dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=${env["API_KEY"]}`,
	).then((v) => v.json());

	if (Array.isArray(res)) {
		if (typeof res[0] == "string") {
			console.log(`\u001b[31m'${word}' not found in thesaurus\u001b[0m`);
			continue;
		} else {
			const response = res as ThesaurusResponse;
			for (const entry of response) {
				if (entry.fl !== partOfSpeech) continue;

				const foundSenseTuples: Array<SenseTuple> = [];
				for (const __v of entry.def) {
					for (const senseTuples of __v.sseq) {
						const senseTuple = senseTuples.find((senseTuple) => {
							for (const v of senseTuple[1].dt) {
								if (v[0] === "text") {
									return true;
								}
							}

							return false;
						});

						if (senseTuple) foundSenseTuples.push(senseTuple);
					}
				}

				let value = undefined;
				if (foundSenseTuples.length === 1) {
					value = [0];
				} else {
					while (value === undefined) {
						const result = prompt(
							`\x1b[0m\x1b[2m------ ${entry.meta.id.toUpperCase()} DISAMBIGUATION ------\x1b[0m` +
								"\n" +
								`\x1b[1m${v.match(/\-(.+)$/)?.[1].trim()}\x1b[0m` +
								"\n" +
								foundSenseTuples
									.map((senseTuple, i) => {
										for (const v of senseTuple[1].dt) {
											if (v[0] === "text") {
												return `\x1b[36m${i}.\x1b[0m ${v[1]}`;
											}
										}
									})
									.join("\n") +
								"\n" +
								"Input:\x1b[36m",
						);

						const results = (result ?? "").split("+");
						for (const v of results) {
							const num = parseInt(v);
							if (foundSenseTuples[num] !== undefined) {
								if (value === undefined) value = [];
								value.push(num);
							} else {
								console.log(`\x1b[0m\x1b[31mInvalid index: ${v}\x1b[0m`);
								value = undefined;
								break;
							}
						}
					}
				}

				list[i] =
					list[i] +
					`\n${value
						.map((v) => {
							return `Synonyms[${v}]: ${foundSenseTuples[v][1].syn_list[0].map((v) => v.wd).join(", ")}`;
						})
						.join("\n")}`;
			}
		}
	}
}

console.log("\x1b[0m\x1b[32mSuccess! Written to output.txt\x1b[0m");

Deno.writeTextFileSync("output.txt", list.join("\n\n"));
