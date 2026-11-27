import {GameObjects, Plugins, Physics, Scene} from "phaser";
import Health from "../components/Health.ts";
import Bullet from "../entities/Bullet.ts";
import Enemy from "../entities/Enemy.ts";
import Player from "../entities/Player.ts";
import GroupUtils from "../utils/GroupUtils.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import { BasicEnemy } from "../entities/enemies/BasicEnemy.ts";
import { ShooterEnemy } from "../entities/enemies/ShooterEnemy.ts";
import { BossEnemy } from "../entities/enemies/BossEnemy.ts";

export default class EntityManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'EntityManager';
    public static readonly MAPPING_NAME: string = 'entityManager';

    private _enemyTypes = 
    [
        { classType: BasicEnemy,  frame: "playerShip2_blue", dataKey: "basicEnemy", type: "regular" },
        { classType: ShooterEnemy, frame: "ufoRed", dataKey: "shooterEnemy", type: "regular" },
        { classType: BossEnemy, frame: "bossEnemy", dataKey: "bossEnemy", type: "boss" }
    ];
    private _scoreBoss: number = 50;

    // noinspection JSUnusedGlobalSymbols
    private readonly bulletGroupConfig = {
        classType: Bullet,
        maxSize: 256,
        runChildUpdate: true,
        createCallback: (bullet: GameObjects.GameObject) => {
            (bullet as Bullet).init();
        }
    }

    private _player: Player;
    private _playerBullets: Physics.Arcade.Group;
    private _enemyGroups: Physics.Arcade.Group[];
    private _regularGroups: Physics.Arcade.Group[];
    private _bossGroups: Physics.Arcade.Group[];
    private _enemyBullets: Physics.Arcade.Group;
    private _spawnOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, EntityManager.PLUGIN_KEY);

        console.log("[EntityManager] Initialized");
    }

    destroy() {
        super.destroy();

        console.log("[EntityManager] Destroyed");
    }

    public initAndSpawnPlayer(): Player {
        this._playerBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(64, this._playerBullets);

        this._player = new Player(this.scene!, GameConstants.ARENA_WIDTH / 2, GameConstants.ARENA_HEIGHT / 2);
        this._player.init(this._playerBullets);

        console.log("[EntityManager] Player spawned");
        this._scoreBoss = 50;

        this.game!.events.emit(GameConstants.Events.PLAYER_SPAWNED_EVENT, this._player);

        return this._player;
    }

    public initEnemies(): Physics.Arcade.Group[] {
        Enemy.kills = 0;

        this._enemyBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(256, this._enemyBullets);

        const groupEntries = this._enemyTypes.map((type) => ({
            type,
            group: this.createEnemyGroup(type.classType, type.frame)
        }));

        this._enemyGroups = groupEntries.map((e) => e.group);
        this._regularGroups = groupEntries
            .filter((e) => e.type.type !== "boss")
            .map((e) => e.group);
        this._bossGroups = groupEntries
            .filter((e) => e.type.type === "boss")
            .map((e) => e.group);

        this._player.setTargets(this._enemyGroups);

        // Spawn enemies indefinitely
        this.scene!.time.addEvent({
            delay: 500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        console.log("[EntityManager] Enemies initialized");

        return this._enemyGroups;
    }

    public initGroupCollisions() {
        // Push enemies apart so they don't stack into a single blob
        this._enemyGroups.forEach((groupA, i) => {
            this.scene!.physics.add.collider(groupA, groupA);
            for (let j = i + 1; j < this._enemyGroups.length; j++) {
                this.scene!.physics.add.collider(groupA, this._enemyGroups[j]);
            }
        });

        this.scene!.physics.add.overlap(this._playerBullets, this._enemyGroups, (bullet, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            (bullet as Bullet).disable();
            (enemy as Enemy).getComponent(Health)?.damage((bullet as Bullet).damage);
        });

        this.scene!.physics.add.overlap(this._player, this._enemyBullets, (player, bullet) => {
            (bullet as Bullet).disable();
            (player as Player).getComponent(Health)?.damage((bullet as Bullet).damage);

            this.scene?.cameras.main.shake(100, 0.01);
        });

        this.scene!.physics.add.overlap(this._player, this._enemyGroups, (player, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            const enemyHealth = (enemy as Enemy).getComponent(Health);
            enemyHealth?.damage(enemyHealth?.max);

            const playerHealth = (player as Player).getComponent(Health);
            playerHealth?.damage(1);

            this.scene?.cameras.main.shake(100, 0.03);
        });

        console.log("[EntityManager] Group collisions initialized");
    }

    private spawnFromGroup(group: Physics.Arcade.Group) {
        const enemy = group.get() as Enemy;
        if (!enemy) {
            return;
        }

        // Spawn on a circle around the camera view, a bit further than its corners: always outside the screen.
        // Center on the view, not the player: at the arena edges the camera stops and the player is off-center
        const view = this.scene!.cameras.main.worldView;
        const spawnRadius = Phaser.Math.Distance.Between(view.centerX, view.centerY, view.right, view.top) + 128;
        Phaser.Math.RandomXY(this._spawnOffset, spawnRadius);
        enemy.enable(view.centerX + this._spawnOffset.x, view.centerY + this._spawnOffset.y);

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);
    }

    private spawnBoss() {
        const total = this._bossGroups.reduce(
            (sum, group) => sum + group.countActive(true),
            0,
        );

        if (total >= 1) {
            return;
        }

        const bossGroup = this.pickBossGroup();
        if (!bossGroup) {
            return;
        }

        this.spawnFromGroup(bossGroup);
        console.log("[EntityManager] Boss spawned");
    }

    private spawnEnemy() {
        if (Enemy.kills >= this._scoreBoss) {
            this._scoreBoss += 20;
            this.spawnBoss();
        }

        const total = this._enemyGroups.reduce(
            (sum, group) => sum + group.countActive(true),
            0,
        );

        if (total >= 50) {
            return;
        }

        const group = this.pickEnemyGroup();
        if (!group) {
            return;
        }

        this.spawnFromGroup(group);

        console.log("[EntityManager] Enemy spawned");
    }

    private createEnemyGroup(classType: typeof Enemy, frame: string): Physics.Arcade.Group {
        return this.scene!.physics.add.group({
            classType: classType,
            defaultKey: "sprites",
            defaultFrame: frame,
            createCallback: (enemy) => {
                (enemy as Enemy).init(this._enemyBullets, this._player);
            },
        });
    }

    private pickEnemyGroup(): Physics.Arcade.Group | undefined {
        const regularTypes = this._enemyTypes.filter((type) => type.type !== "boss");
        const rates: number[] = regularTypes.map((type) => this.scene!.cache.json.get('enemies')?.[type.dataKey]?.spawnRate ?? 1);
        let roll = Math.random() * rates.reduce((sum, rate) => sum + rate, 0);

        const index = regularTypes.findIndex((_, i) => (roll -= rates[i]) < 0);
        return index !== -1 ? this._regularGroups[index] : undefined;
    }

    private pickBossGroup(): Physics.Arcade.Group | undefined {
        const bossTypes = this._enemyTypes.filter((type) => type.type === "boss");
        if (bossTypes.length === 0) {
            return undefined;
        }

        const rates: number[] = bossTypes.map((type) => this.scene!.cache.json.get('enemies')?.[type.dataKey]?.spawnRate ?? 1);
        let roll = Math.random() * rates.reduce((sum, rate) => sum + rate, 0);

        const index = bossTypes.findIndex((_, i) => (roll -= rates[i]) < 0);
        return index !== -1 ? this._bossGroups[index] : undefined;
    }
}