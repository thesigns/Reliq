// Short parchment notice under the top bar.

export class Toast {
  constructor(el) {
    this.el = el;
    this.timer = 0;
  }

  show(text, ms = 4200) {
    clearTimeout(this.timer);
    this.el.textContent = text;
    this.el.hidden = false;
    this.el.classList.remove('show');
    void this.el.offsetWidth;
    this.el.classList.add('show');
    this.timer = setTimeout(() => this.hide(), ms);
  }

  hide() {
    this.el.classList.remove('show');
    this.timer = setTimeout(() => { this.el.hidden = true; }, 350);
  }
}
