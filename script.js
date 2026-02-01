$(document).ready(function(){

    // ——————————————————————————————————————————————————
    // Mobile menu toggle
    // ——————————————————————————————————————————————————
    $('#menu').click(function(){
      $(this).toggleClass('fa-times');
      $('header').toggleClass('toggle');
    });

    // ——————————————————————————————————————————————————
    // Scroll: close mobile nav + show/hide back-to-top
    // ——————————————————————————————————————————————————
    $(window).on('scroll load', function(){
      $('#menu').removeClass('fa-times');
      $('header').removeClass('toggle');

      if($(window).scrollTop() > 0){
        $('.top').show();
      } else {
        $('.top').hide();
      }
    });

    // ——————————————————————————————————————————————————
    // Smooth scrolling for anchor links
    // ——————————————————————————————————————————————————
    $('a[href*="#"]').on('click', function(e){
      e.preventDefault();
      $('html, body').animate({
        scrollTop: $($(this).attr('href')).offset().top
      }, 500, 'linear');
    });

    // ——————————————————————————————————————————————————
    // TextScramble – animated glitch effect for hero text
    // ——————————————————————————————————————————————————
    class TextScramble {
      constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
      }

      setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
          const from = oldText[i] || '';
          const to   = newText[i] || '';
          const start = Math.floor(Math.random() * 40);
          const end   = start + Math.floor(Math.random() * 40);
          this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
      }

      update() {
        let output   = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
          let { from, to, start, end, char } = this.queue[i];
          if (this.frame >= end) {
            complete++;
            output += to;
          } else if (this.frame >= start) {
            if (!char || Math.random() < 0.28) {
              char = this.randomChar();
              this.queue[i].char = char;
            }
            output += `<span class="dud">${char}</span>`;
          } else {
            output += from;
          }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
          this.resolve();
        } else {
          this.frameRequest = requestAnimationFrame(this.update);
          this.frame++;
        }
      }

      randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
      }
    }

    // ——————————————————————————————————————————————————
    // Rotating phrases – updated for Data Engineer role
    // ——————————————————————————————————————————————————
    const phrases = [
      'I design and build large-scale data pipelines end-to-end.',
      'PySpark, Databricks & AWS are my daily stack.',
      'Turning raw data into reliable, performant infrastructure.',
      'B.Tech CSE graduate from SRM Institute of Science & Technology.',
      'Passionate about data engineering, analytics, and clean code.',
      'I love making pipelines faster, cleaner, and more maintainable.'
    ];

    const el = document.querySelector('.text');
    const fx = new TextScramble(el);

    let counter = 0;
    const next = () => {
      fx.setText(phrases[counter]).then(() => {
        setTimeout(next, 4000);
      });
      counter = (counter + 1) % phrases.length;
    };

    next();

});
