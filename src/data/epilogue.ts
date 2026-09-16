// ─────────────────── epilogue ───────────────────
//
// The end-screen epilogue is the final-card sequence that plays after
// chapter 14 victory. Each card is a Hawk-of-the-Light farewell line
// followed by a final closing line. Designed to be slow and cinematic —
// the user advances at their own pace by clicking the screen.
//
// The epilogue also drives the full-field-guide unlock: every defId in
// the campaign's character pool becomes visible after chapter 14.

export interface EpilogueCard {
  /** id used as a React key */
  id: string;
  /** who's speaking (display name; or 'none' for narration) */
  speaker: string;
  /** portrait key for the speaker (omit for narration) */
  portrait?: string;
  /** the line — shown in a quote block */
  text: string;
  /** visual decoration hint */
  tone: 'farewell' | 'promise' | 'closing' | 'narration';
}

export const EPILOGUE_CARDS: EpilogueCard[] = [
  {
    id: 'narrate-opening',
    speaker: 'none',
    tone: 'narration',
    text: 'The Falcon has fallen. The city of Falconia is a dream of dust. The God-Hand-Eclipse is a wound in the world, and the wound is closed. The sky over Elfhelm is grey, but grey skies do not last forever.',
  },
  {
    id: 'guts',
    speaker: 'Guts',   portrait: 'guts',
    tone: 'farewell',
    text: 'We buried them where they fell. Schierke planted a rowan on the mound. The wind sounds like wings, sometimes. I keep waiting for the falcon.',
  },
  {
    id: 'casca',
    speaker: 'Casca',  portrait: 'casca',
    tone: 'farewell',
    text: 'I remember everything now. I remember the Eclipse. I remember the men who died so I could be here to hold a sword again. I will not waste that. Not a single day of it.',
  },
  {
    id: 'judeau',
    speaker: 'Judeau', portrait: 'judeau',
    tone: 'farewell',
    text: 'My hand shook for a year. Then it stopped. The new hawk needs a hand that draws cleanly. Mine will do.',
  },
  {
    id: 'corkus',
    speaker: 'Corkus', portrait: 'corkus',
    tone: 'farewell',
    text: 'I am older than I was. That is, in the end, the only thing anyone can say about surviving.',
  },
  {
    id: 'pippin',
    speaker: 'Pippin', portrait: 'pippin',
    tone: 'farewell',
    text: 'There is a smithy in the next village. The apprentices are children. Someone has to teach them not to bend the blade.',
  },
  {
    id: 'rickert',
    speaker: 'Rickert', portrait: 'rickert',
    tone: 'farewell',
    text: 'I am going back to Falconia. To rebuild it. Not as a city of a man — as a city of people. That is what the Hawk was supposed to be, before. It can be, again.',
  },
  {
    id: 'narrate-mid',
    speaker: 'none',
    tone: 'narration',
    text: 'They leave one by one. Not because the Hawk is over. Because the Hawk was always something you could put down, and still carry.',
  },
  {
    id: 'guts-closing',
    speaker: 'Guts',   portrait: 'guts',
    tone: 'closing',
    text: 'I will not ask any of you to stay. I will not promise I will be kind. I will promise this: I will not stop. I will swing until the sword breaks. I will swing until the swing is all that is left. And when the swing is all that is left, I will swing again.',
  },
  {
    id: 'narrate-final',
    speaker: 'none',
    tone: 'closing',
    text: 'The wind shifts. Somewhere, far south, a falcon folds its wings and dives toward the ground — and becomes, for one clear instant, a hawk.',
  },
];

// Final closing line — single, shown after the last card.
export const EPILOGUE_CLOSING = '— End of Campaign —';
