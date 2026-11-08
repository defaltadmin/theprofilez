import { describe, expect, it } from 'vitest';
import { canPublishProfile } from '../src/lib/profile-rules';

const completeProfile = {
  name_en: 'Sample Person',
  name_ar: 'شخصية تجريبية',
  title_en: 'Founder',
  title_ar: 'مؤسس',
  summary_en: 'A sample summary.',
  summary_ar: 'نبذة تجريبية.',
  consent_confirmed: 1,
  consent_note: 'Written permission recorded.',
};

describe('profile publishing rules', () => {
  it('allows a complete bilingual profile with recorded consent', () => {
    expect(canPublishProfile(completeProfile)).toBe(true);
  });
  it('blocks publishing when Arabic content is missing', () => {
    expect(canPublishProfile({ ...completeProfile, title_ar: '' })).toBe(false);
  });
  it('blocks publishing without explicit consent confirmation', () => {
    expect(canPublishProfile({ ...completeProfile, consent_confirmed: 0 })).toBe(false);
  });
  it('blocks publishing without a documented consent note', () => {
    expect(canPublishProfile({ ...completeProfile, consent_note: '' })).toBe(false);
  });
});
