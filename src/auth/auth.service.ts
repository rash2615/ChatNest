import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // En production, comparer avec le hash du mot de passe
    // Pour l'instant, comparaison simple (sera remplacé par bcrypt dans JWT)
    if (user.password !== password) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    return {
      message: 'Connexion réussie',
      user,
      // Le token JWT sera ajouté dans la branche Features/JWT
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = this.usersService.create(registerDto);
      
      return {
        message: 'Inscription réussie',
        user,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Erreur lors de l\'inscription');
    }
  }
}

