import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";

export default class Movement implements IComponent {
  public enabled: boolean = true;

  private _baseSpeed = 0;
  private _speedMultiplier = 1;
  private _speed: number = 0;

  public constructor(speed?: number) {
    if (speed !== undefined) {
      this.setSpeed(speed);
    }
  }

  public setSpeed(speed: number) {
    this._baseSpeed = speed;
    this.updateSpeed();
  }

  public setSpeedMultriplier(multiplier: number) {
    this._speedMultiplier = multiplier;
    this.updateSpeed();
  }

  private updateSpeed() {
    this._speed = this._baseSpeed * this._speedMultiplier;
  }

  public moveHorizontally(entity: Entity, deltaTime: number) {
    if (!this.enabled) return;

    entity.x += this._speed * deltaTime;
  }

  public moveVertically(entity: Entity, deltaTime: number) {
    if (!this.enabled) return;

    entity.y += this._speed * deltaTime;
  }

  // direction must be normalized, or diagonals go faster
  public move(
    entity: Entity,
    direction: Phaser.Math.Vector2,
    deltaTime: number,
  ) {
    if (!this.enabled) return;

    entity.x += direction.x * this._speed * deltaTime;
    entity.y += direction.y * this._speed * deltaTime;
  }
}
