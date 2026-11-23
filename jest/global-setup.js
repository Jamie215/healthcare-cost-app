// Runs once before the test processes start. Tests run in the study's time zone, so
// date rules ("not in the future") behave the same on every computer and in CI.
module.exports = () => {
  process.env.TZ = 'America/Toronto';
};
