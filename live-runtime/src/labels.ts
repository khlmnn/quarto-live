import { b64Decode } from './utils';

// Texts shown on editor buttons and as default editor captions. The built-in
// set is chosen by the document language (`lang`); single texts can be
// overridden under `live: labels:` in the document or project metadata.
// live.lua passes both in a `<script type="live-labels">` element.

export type Labels = {
  'run-code': string;
  'run-above': string;
  'start-over': string;
  'show-hint': string;
  'next-hint': string;
  'show-solution': string;
  'caption-python': string;
  'caption-r': string;
  'caption-exercise': string;
};

const builtin: { [lang: string]: Labels } = {
  en: {
    'run-code': 'Run Code',
    'run-above': 'Run All Above',
    'start-over': 'Start Over',
    'show-hint': 'Show Hint',
    'next-hint': 'Next Hint',
    'show-solution': 'Show Solution',
    'caption-python': 'Python Code',
    'caption-r': 'R Code',
    'caption-exercise': 'Exercise',
  },
  sv: {
    'run-code': 'Kör kod',
    'run-above': 'Kör alla ovan',
    'start-over': 'Börja om',
    'show-hint': 'Visa ledtråd',
    'next-hint': 'Nästa ledtråd',
    'show-solution': 'Visa lösning',
    'caption-python': 'Python-kod',
    'caption-r': 'R-kod',
    'caption-exercise': 'Övning',
  },
};

let cached: Labels | undefined;

export function getLabels(): Labels {
  if (cached) return cached;
  let lang = document.documentElement.lang;
  let overrides: { [key: string]: string } = {};
  const elem = document.querySelector('script[type="live-labels"]');
  if (elem) {
    try {
      const data = JSON.parse(b64Decode(elem.textContent));
      if (typeof data.lang === 'string' && data.lang) lang = data.lang;
      if (data.labels && typeof data.labels === 'object') overrides = data.labels;
    } catch (err) {
      console.warn('Could not read live-labels:', err);
    }
  }
  const base = builtin[(lang || 'en').toLowerCase().split(/[-_]/)[0]] ?? {};
  cached = Object.assign({}, builtin.en, base, overrides);
  return cached;
}
