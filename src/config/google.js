import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserRepository } from '../modules/users/repositories/userRepository.js';
import { EmailService } from '../shared/services/emailService.js';
import { hashPassword } from '../shared/utils/hashPassword.js';


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

    let user = await UserRepository.findByEmail(email);

    if (!user) {
      // ✅ CASO 1: Usuario nuevo → crear con contraseña hasheada
      const hashedPassword = await hashPassword('OAUTH_GOOGLE');
      
      user = await UserRepository.create({
        idGoogle: googleId,
        fullName: fullName,
        email: email,
        pass_word: hashedPassword,  // ← HASHEADA
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
      // ✅ CASO 2: Usuario existente → vincular Google
      user = await UserRepository.update(user.id_user, {
        idGoogle: googleId,
      });
      console.log(`✅ Google account linked to existing user: ${email}`);
    }

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