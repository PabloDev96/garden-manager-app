import { sileo } from "sileo";

const styles = {
  success: { background: "#5B7B7A", color: "#fff", borderRadius: "14px" },
  error:   { background: "#A17C6B", color: "#fff", borderRadius: "14px" },
  info:    { background: "#5B7B7A", color: "#fff", borderRadius: "14px" },
  warning: { background: "#CEB5A7", color: "#5B7B7A", borderRadius: "14px" },
};

const defaults = {
  duration: 2500,
};

function normalize(input) {
  if (typeof input === "string") return { title: input };
  return input ?? {};
}

export const notify = {
  success: (input, opts = {}) => {
    const { title, description, duration, style } = { ...defaults, ...normalize(input), ...opts };
    return sileo.success({
      title,
      description,
      duration,
      style: { ...styles.success, ...style },
    });
  },

  error: (input, opts = {}) => {
    const { title, description, duration, style } = { ...defaults, ...normalize(input), ...opts };
    return sileo.error({
      title,
      description,
      duration,
      style: { ...styles.error, ...style },
    });
  },

  info: (input, opts = {}) => {
    const { title, description, duration, style } = { ...defaults, ...normalize(input), ...opts };
    return sileo.info({
      title,
      description,
      duration,
      style: { ...styles.info, ...style },
    });
  },

  warning: (input, opts = {}) => {
    const { title, description, duration, style } = { ...defaults, ...normalize(input), ...opts };
    return sileo.warning({
      title,
      description,
      duration,
      style: { ...styles.warning, ...style },
    });
  },
};