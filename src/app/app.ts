import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { HospitalChatbot } from "./shared/hospital-chatbot/hospital-chatbot";



@Component({
  selector: 'app-root',

  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    HospitalChatbot
],

  templateUrl: './app.html',

  styleUrl: './app.css'
})
export class App {

}