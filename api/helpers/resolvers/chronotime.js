const chrono = require("chrono-node");

module.exports = {
  friendlyName: "resolvers.chronotime",

  description: "Resolve a chrono-node string to a Date.",

  inputs: {
    date: {
      type: "string",
      required: true,
    },
  },

  fn: async function (inputs) {
    let date = chrono.parseDate(inputs.date, new Date(), { forwardDate: true });

    if (date === null)
      throw new Error(
        `Unrecognized date, time, or duration of time provided for ${inputs.date}.`
      );

    // Bug where specifying a time on that has already elapsed resolves to the past time when it should resolve to tomorrow's
    if (moment().isAfter(moment(date))) {
      return moment(date).add(1, "days").toDate();
    }

    return date;
  },
};
