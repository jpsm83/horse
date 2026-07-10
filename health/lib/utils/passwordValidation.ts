const passwordValidation = (password: string) => {
  // Require at least one lowercase, one uppercase, one digit, and one symbol (any non-alphanumeric)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
  
  return passwordRegex.test(password);
};

export default passwordValidation;
