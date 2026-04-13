const { CLOSING_STRATEGY } = require('./closingStrategies');

const CLOSING_SCRIPT_PROFILES = {
  [CLOSING_STRATEGY.CLOSE_NEW_CLIENT_SOFT]: {
    goal: 'build trust and move toward booking',
    tone: 'warm, elegant, reassuring',
    message_intent: 'soft onboarding close',
    persuasion_angle: 'emotional care + spa at home',
    allowed_offer_direction: 'guide naturally toward the most suitable next step',
    next_step_focus: 'ask one useful step only'
  },
  [CLOSING_STRATEGY.CLOSE_SERVICE_TO_COMBO_UPGRADE]: {
    goal: 'elevate from an individual service to a better-value experience',
    tone: 'warm, premium, non-pushy',
    message_intent: 'gentle upgrade suggestion',
    persuasion_angle: 'experience over basic service',
    allowed_offer_direction: 'Glow Express or Experiencia ZAPATA when context supports it',
    next_step_focus: 'suggest a richer path while asking one next step'
  },
  [CLOSING_STRATEGY.CLOSE_EXISTING_CLIENT_FAST_TRACK]: {
    goal: 'reduce friction and accelerate booking',
    tone: 'confident, close, elegant',
    message_intent: 'fast-track continuation',
    persuasion_angle: 'continuity + convenience',
    allowed_offer_direction: 'continue smoothly from known preferences',
    next_step_focus: 'move quickly with one clear next step'
  },
  [CLOSING_STRATEGY.CLOSE_BIRTHDATE_ENRICHMENT_SOFT]: {
    goal: 'enrich profile without breaking momentum',
    tone: 'soft, caring, delicate',
    message_intent: 'light enrichment ask',
    persuasion_angle: 'personalized care / special detail',
    allowed_offer_direction: 'keep commercial pressure low',
    next_step_focus: 'ask for birthdate softly and only if relevant'
  },
  [CLOSING_STRATEGY.CLOSE_MANUAL_REVIEW_SAFE]: {
    goal: 'preserve trust while pausing automation',
    tone: 'controlled, elegant, reassuring',
    message_intent: 'safe manual handoff',
    persuasion_angle: 'personalized attention',
    allowed_offer_direction: 'do not push a sale while clarifying',
    next_step_focus: 'protect experience and set expectation'
  },
  [CLOSING_STRATEGY.CLOSE_REACTIVATION_SOFT]: {
    goal: 'warm re-engagement',
    tone: 'warm, familiar, elegant',
    message_intent: 'soft reactivation',
    persuasion_angle: 'it is time for your next moment / continuity of care',
    allowed_offer_direction: 'invite the client back naturally',
    next_step_focus: 'restart momentum with one easy next step'
  }
};

module.exports = {
  CLOSING_SCRIPT_PROFILES
};
