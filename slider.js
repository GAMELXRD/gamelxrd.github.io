const wrapper = document.querySelector('.wrapper');

let presses = false;
let startX = 0;

wrapper.addEventListener('mousedown', function (e) {
    pressed = true;
    startX = e.clientX;
    this.style.cursor = 'grabbing';
});

wrapper.addEventListener('mouseleave', function (e) {
    pressed = false;
});

window.addEventListener('mouseup', function (e) {
    pressed = false;
    wrapper.style.cursor = 'grab';
});

wrapper.addEventListener('mousemove', function (e) {
    if (!pressed) {
        return;
    };

    this.scrollLeft += startX - e.clientX;
});

wrapper.addEventListener('wheel', function (e) {
    if (e.deltaY > 0) {
        e.currentTarget.scrollLeft += e.currentTarget.clientWidth / 2;
    } else {
        e.currentTarget.scrollLeft -= e.currentTarget.clientWidth / 2;
    }
});