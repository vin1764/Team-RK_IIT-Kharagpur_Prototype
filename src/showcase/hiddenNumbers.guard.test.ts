// Guard: the showcase sidebar never shows the deck's hidden numbers (the launch price drops and the
// fee rate stay off-screen). Sweeps everything the sidebar renders: the registry text, the tour step
// text and every "Behind it" line for every persona and day.
import { expect, test } from 'vitest';
import { DEMO_GUIDE } from '../layout/demoGuide';
import { BEHIND, REGISTRY } from './source';

const HIDDEN = /₹\s?(160|370|13|34)(?!\d)|2\.5\s?%/;

test('no hidden numbers in anything the showcase sidebar renders', () => {
  const texts: string[] = [JSON.stringify(REGISTRY), ...DEMO_GUIDE.map((s) => `${s.title} ${s.body}`)];
  const routes = [...new Set(REGISTRY.features.map((f) => f.route))];
  for (const persona of ['jasmeet', 'samar', 'reseller'] as const)
    for (let day = 0; day <= 90; day++)
      for (const lang of ['en', 'hi'] as const)
        for (const fn of Object.values(BEHIND))
          for (const route of day % 10 === 0 ? routes : [routes[0]!]) {
            try {
              texts.push(...fn({ persona, day, lang, route }));
            } catch {
              // a calculation that doesn't apply to this context renders nothing
            }
          }
  expect(texts.filter((t) => HIDDEN.test(t))).toEqual([]);
});
