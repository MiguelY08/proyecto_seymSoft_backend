import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserRepository } from '../modules/users/repositories/userRepository.js';
import { EmailService } from '../shared/services/emailService.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const fullName = profile.displayName || 'Usuario Google';
        const googleId = profile.id;

        if (!email) {
          return done(new Error('No email from Google'), null);
        }

        // Buscar usuario existente por email
        let user = await UserRepository.findByEmail(email);

        if (!user) {
          // ✅ CASO 1: Usuario nuevo → crear cuenta
          user = await UserRepository.create({
            idGoogle: googleId,
            fullName: fullName,
            email: email,
            password: 'OAUTH_GOOGLE',
            phone: null,
            idStatus: 1,
          });

          try {
            await EmailService.sendLandingWelcomeEmail(user.email, user.fullName);
            console.log(`✅ Google welcome email sent to ${user.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send Google welcome email:`, emailError.message);
          }

        } else if (!user.idGoogle) {
          // ✅ CASO 2: Usuario existente con cuenta normal → vincular Google
          // Actualiza el idGoogle para que en el futuro reconozca esta cuenta
          user = await UserRepository.update(user.idUser, {
            idGoogle: googleId,
          });
          console.log(`✅ Google account linked to existing user: ${email}`);

        }
        // ✅ CASO 3: Usuario existente con Google → login normal, no hacer nada

        return done(null, user);

      } catch (error) {
        console.error('Error en Google Strategy:', error);
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.idUser);
});

passport.deserializeUser(async (id_user, done) => {
  try {
    const user = await UserRepository.findById(id_user);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;