import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/; // minimal ada huruf besar, kecil, angka

export class RegisterDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(128)
  @Matches(PASSWORD_RULE, {
    message: 'Password harus mengandung huruf besar, kecil, dan angka',
  })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULE, {
    message: 'Password harus mengandung huruf besar, kecil, dan angka',
  })
  newPassword!: string;
}
