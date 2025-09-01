export const generateStrongPassword = (length = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+{}[]<>?,.";

  // Ensure at least one of each requirement
  const requiredChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + specials;
  const remaining = Array.from(
    { length: length - requiredChars.length },
    () => allChars[Math.floor(Math.random() * allChars.length)]
  );

  // Shuffle so required chars aren’t always first
  const passwordArray = [...requiredChars, ...remaining];
  return passwordArray.sort(() => Math.random() - 0.5).join("");
};
