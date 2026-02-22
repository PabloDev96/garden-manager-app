import { sileo } from "sileo";

const defaults = {
  duration: 2500,
};

function normalize(input) {
  if (typeof input === "string") return { title: input };
  return input ?? {};
}

export const notify = {
  success: (input, opts = {}) => {
    const { title, description, duration } = { ...defaults, ...normalize(input), ...opts };
    return sileo.success({ title, description, duration });
  },

  error: (input, opts = {}) => {
    const { title, description, duration } = { ...defaults, ...normalize(input), ...opts };
    return sileo.error({ title, description, duration });
  },

  info: (input, opts = {}) => {
    const { title, description, duration } = { ...defaults, ...normalize(input), ...opts };
    return sileo.info({ title, description, duration });
  },

  warning: (input, opts = {}) => {
    const { title, description, duration } = { ...defaults, ...normalize(input), ...opts };
    return sileo.warning({ title, description, duration });
  },
};