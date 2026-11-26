import Enemy from "../Enemy.ts";
import Movement from "../../components/Movement.ts";

export class MovingEnemy extends Enemy {
  private _direction: number = 1;
  private _horizontalFactor: number = 1.5;
  private _offset: number = 65;

  init(bulletsGroup: Phaser.Physics.Arcade.Group) {
    this._bulletData.shots = 3;
    this._bulletData.angle = 45;
    this._speed = 0.15;
    super.init(bulletsGroup);
  }
  preUpdate(timeSinceLaunch: number, deltaTime: number) {
    super.preUpdate(timeSinceLaunch, deltaTime);

    // Destroy entities when out of screen
    if (this.y > this.scene.cameras.main.height + this.displayHeight) {
      this.disable();
    }

    if (this.x >= this.scene.cameras.main.width - this._offset) {
      this._direction = -1;
    } else if (this.x <= this._offset) {
      this._direction = 1;
    }

    this.getComponent(Movement)?.moveHorizontally(
      this,
      deltaTime * this._direction * this._horizontalFactor,
    );
  }
}
