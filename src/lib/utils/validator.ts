export class inputValidator {  
    username(username: string) {
        const usernameRegex = /^[a-z0-9_-]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return "Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores.";
        }
        return null;
    }

    password(password: string) {
        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }
        return null;
    }

    displayName(displayName: string) {
        const displayNameRegex = /^[a-zA-Z0-9\s]{3,50}$/;
        if (!displayNameRegex.test(displayName)) {
            return "Display name must be 3-50 characters long and can only contain letters, numbers, and spaces.";
        }
        return null;
    }
    Age(birthDate: string) {
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        if (age < 18) {
            return "nah, you're too young dawg ☠️";
        }
        return null;
    }

    Email(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return "Please enter a valid email address.";
        }
        return null;
      }
}
