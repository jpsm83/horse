interface ValidationObject {
  [key: string]: string | number | boolean | undefined;
  password?: string;
  email?: string;
}

interface ValidationOptions {
  reqFields: string[];
  nonReqFields: string[];
}

const objDefaultValidation = (
  obj: ValidationObject,
  { reqFields, nonReqFields }: ValidationOptions
): true | string => {
  // Check obj is an object
  if (typeof obj !== "object" || obj === null) {
    return "Object must be a non-null object!";
  }

  const allFields = new Set([...reqFields, ...nonReqFields]);

  // Check for any invalid keys and validate each parameter
  for (const key of Object.keys(obj)) {
    if (!allFields.has(key)) {
      return `Invalid key: ${key}`;
    }

    // Check required fields have a value
    if (
      reqFields.includes(key) &&
      (obj[key] === undefined || obj[key] === null || obj[key] === "")
    ) {
      return `${key} must have a value!`;
    }

    // Password validation
    if (key === "password" && typeof obj.password === "string") {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!passwordRegex.test(obj.password)) {
        return "Password must be at least 8 characters long and contain a lowercase letter, an uppercase letter, a symbol, and a number!";
      }
    }

    // Email validation
    if (key === "email" && typeof obj.email === "string") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailRegex.test(obj.email)) {
        return "Please enter a valid email address!";
      }
    }
  }

  // Check for missing required fields
  for (const key of reqFields) {
    if (!(key in obj)) {
      return `Missing key: ${key}`;
    }
  }

  return true;
};

export default objDefaultValidation;
