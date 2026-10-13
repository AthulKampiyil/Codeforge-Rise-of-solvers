type Point = { x: number; y: number };

/** HUD particles live in screen space, independent of the village camera. */
export class ResourceFlights {
  private active = new Map<Animation, HTMLElement>();

  emit(from: Point, to: Point, resource: 'gold' | 'elixir' | 'dark') {
    for (let i = 0; i < 7; i++) {
      const x = from.x + (Math.random() - 0.5) * 30;
      const y = from.y + (Math.random() - 0.5) * 18;
      const dot = document.createElement('span');
      dot.className = `resource-flight ${resource}`;
      dot.setAttribute('aria-hidden', 'true');
      dot.style.left = `${x - 5}px`;
      dot.style.top = `${y - 5}px`;
      document.body.append(dot);
      const animation = dot.animate(
        [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${to.x - x}px, ${to.y - y}px) scale(0.35)`, opacity: 0.5 },
        ],
        {
          duration: 420 + i * 45,
          delay: i * 38,
          easing: 'cubic-bezier(.55, 0, 1, .45)',
          fill: 'both',
        },
      );
      this.active.set(animation, dot);
      const remove = () => {
        dot.remove();
        this.active.delete(animation);
      };
      animation.onfinish = remove;
      animation.oncancel = remove;
    }
  }

  clear() {
    for (const [animation, dot] of this.active) {
      animation.cancel();
      dot.remove();
    }
    this.active.clear();
  }
}
