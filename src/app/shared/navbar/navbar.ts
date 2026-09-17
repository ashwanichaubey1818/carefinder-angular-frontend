import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly menuOpen = signal(false);


  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }


  closeMenu(): void {
    this.menuOpen.set(false);
  }


  logout(): void {

    // Login session clear 
    this.auth.logout();

    // Mobile menu close 
    this.closeMenu();

    // Home page navigation
    void this.router.navigate(['/']);
  }
}