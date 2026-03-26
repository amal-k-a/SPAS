import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'requestVerificationCode',
      'activateAccount'
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  it('shows a validation error when login fields are empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.login();

    expect(component.error).toBe('Please enter email and password');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('navigates to the dashboard after a successful login', () => {
    authService.login.and.returnValue(
      of({
        token: 'token',
        name: 'Faculty',
        role: 'teacher',
        email: 'faculty@kristujayanti.com',
        isFirstLogin: false
      })
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.loginEmail = 'faculty@kristujayanti.com';
    component.loginPassword = 'Password123';

    component.login();

    expect(authService.login).toHaveBeenCalledWith('faculty@kristujayanti.com', 'Password123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('surfaces backend errors during activation', () => {
    authService.activateAccount.and.returnValue(
      throwError(() => ({ error: { error: 'Invalid verification code' } }))
    );

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.setMode('activate');
    component.activationEmail = 'faculty@kristujayanti.com';
    component.verificationCode = '123456';
    component.activationPassword = 'Password123';

    component.activateAccount();

    expect(component.error).toBe('Invalid verification code');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
