function validateDomain(domain) {
  if (typeof domain !== "string") return false;

  const value = domain.trim();

  if (value.length > 253 || value.length === 0) {
    return false;
  }

  const regex =
    /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

  return regex.test(value);
}

module.exports = validateDomain;