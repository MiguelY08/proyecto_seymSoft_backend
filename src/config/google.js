import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthRepository } from '../modules/users/auth/repositories/authRepository.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const full_name = profile.displayName;
        const google_id = profile.id;

        // Buscar usuario existente
        let user = await AuthRepository.findUserByEmail(email);

        // Si no existe, crearlo
        if (!user) {
          user = await AuthRepository.createUser({
            email,
            full_name,
            doc_type: 'GOOGLE',
            doc_number: BigInt(0), // Google no proporciona un número de documento, se puede usar un valor predeterminado
            pass_word: 'OAUTH_GOOGLE',
            id_status: 1
          });
        }

        return done(null, user);

      } catch (error) {
        console.error('Error en Google Strategy:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id_user);
});

passport.deserializeUser(async (id_user, done) => {
  try {
    const user = await AuthRepository.findUserById(id_user);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;