type SenseTuple = [
	"sense",
	{
		sn: string;
		dt: Array<["text", string] | ["vis" | Array<{ t: string }>]>; //defining text
		syn_list: [Array<{ wd: string }>];
	},
];

export type ThesaurusResponse = Array<{
	meta: { id: string; uuid: string; sort: string; src: string; section: string; stems: string[]; offensive: boolean };
	hom: number; //homograph
	hwi: {
		hw: string; //headword
		prs: Array<{ mw: string; sound: { audio: string; ref: string; stat: string } }>; //pronunciation
	};
	ahws: Array<{ hw: string }>; //alternate headwords
	vrs: Array<{ va: string; vl: string }>; //variants
	fl: string; //part of speech
	def: Array<{
		vd: string; //verb divider
		sseq: SenseTuple[][];
	}>;
}>;
