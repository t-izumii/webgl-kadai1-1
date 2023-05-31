// 必要なモジュールを読み込み
import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';

// DOM がパースされたことを検出するイベントを設定
window.addEventListener('DOMContentLoaded', () => {
  // 制御クラスのインスタンスを生成
  const app = new App3();
  // 初期化
  app.init();
  // 描画
  app.render();
}, false);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      // fovy は Field of View Y のことで、縦方向の視野角を意味する
      fovy: 60,
      // 描画する空間のアスペクト比（縦横比）
      aspect: window.innerWidth / window.innerHeight,
      // 描画する空間のニアクリップ面（最近面）
      near: 0.1,
      // 描画する空間のファークリップ面（最遠面）
      far: 400.0,
      // カメラの位置
      x: 0.0,
      y: 0.0,
      z: 25.0,
      // カメラの中止点
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      // レンダラーが背景をリセットする際に使われる背景色
      clearColor: 0x666666,
      // レンダラーが描画する領域の横幅
      width: window.innerWidth,
      // レンダラーが描画する領域の縦幅
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0,  // 光の強度
      x: 1.0,          // 光の向きを表すベクトルの X 要素
      y: 1.0,          // 光の向きを表すベクトルの Y 要素
      z: 1.0           // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.2,  // 光の強度
    };
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff, // マテリアルの基本色
    };
  }
  static get LINE_MATERIAL_PARAM() {
    return {
      color: 0x000000, // マテリアルの基本色
      transparent: true,
      opacity: 0.0,
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer;         // レンダラ
    this.scene;            // シーン
    this.camera;           // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight;     // アンビエントライト
    this.material;         // マテリアル
    this.boxGeometry       // ボックスジオメトリ
    this.box               // メッシュ
    this.controls;         // オービットコントロール
    this.axesHelper;       // 軸ヘルパー

    this.isDown = false; // キーの押下状態を保持するフラグ

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
    this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far,
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z,
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z,
    );
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);


    // マテリアル
    const BOX_ROW = 25;
    const BOX_COL = 20;
    const BOX_SIZE = 1.0;
    const gridWidth = BOX_ROW * BOX_SIZE;
    const gridHeight = BOX_COL * BOX_SIZE;
    const offsetX = -gridWidth / 2;
    const offsetY = -gridHeight / 2;

    this.boxGeometry = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    for (let row = 1; row < BOX_COL; row++) {
      for (let col = 1; col < BOX_ROW; col++) {
        this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);
        this.box = new THREE.Mesh(this.boxGeometry, this.material);
        // 0x000000
        if( col === 5 && row === 1 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 13 && row === 1 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 6 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 12 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 14 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 7 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 12 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 14 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 7 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 11 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 14 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 8 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 11 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 15 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 8 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 10 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 15 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 9 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 15 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 15 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 6 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 16 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 17 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 18 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 19 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 20 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 10 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 21 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 21 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 15 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 22 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 4 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 14 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 16 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 22 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 5 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 6 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 7 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 13 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 16 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 19 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 22 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 8 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 14 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 17 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 18 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 20 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }
        if( col === 21 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x000000);
        }


        // 0x69889d
        if( col === 5 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 5 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 6 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 5 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 6 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 6 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 7 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 7 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 7 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 8 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 15 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 10 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 16 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }
        if( col === 11 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x69889d);
        }

        // 0x6eb2dd
        if( col === 13 && row === 2 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 3 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 12 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 4 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 12 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 7 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 15 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 6 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 12 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 5 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 6 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 9 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 12 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 5 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 6 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 9 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 6 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 9 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 15 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 13 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 14 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 9 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 11 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 12 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 8 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 9 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }
        if( col === 10 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x6eb2dd);
        }

        // 0x424040
        if( col === 5 && row === 5 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 5 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 6 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 12 && row === 6 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 6 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 10 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 12 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 6 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 7 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 8 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 12 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 11 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 16 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 16 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 12 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 17 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 11 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 17 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 17 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 6 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 16 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 18 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 18 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 5 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 18 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 12 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 9 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 10 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }
        if( col === 13 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x424040);
        }


        // 0x5c6060
        if( col === 13 && row === 7 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 10 && row === 8 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 12 && row === 9 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 10 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 14 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 15 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 17 && row === 11 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 14 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 15 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 16 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 18 && row === 12 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 5 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 13 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 14 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 15 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 16 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 18 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 19 && row === 13 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 6 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 13 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 14 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 15 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 16 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 18 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 19 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 20 && row === 14 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 12 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 13 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 14 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 17 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 19 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 20 && row === 15 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 5 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 6 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 9 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 10 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 11 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 12 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 17 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 19 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 20 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 21 && row === 16 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 6 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 7 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 8 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 17 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 19 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 20 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 21 && row === 17 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 17 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 18 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 20 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 21 && row === 18 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 11 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }
        if( col === 12 && row === 19 ) {
          this.box.material.color = new THREE.Color(0x5c6060);
        }

        // 0xffffff
        if( col === 12 && row === 13 ) {
          this.box.material.color = new THREE.Color(0xffffff);
        }
        if( col === 12 && row === 14 ) {
          this.box.material.color = new THREE.Color(0xffffff);
        }

        // 0xff5552
        if( col === 11 && row === 14 ) {
          this.box.material.color = new THREE.Color(0xff5552);
        }
        if( col === 10 && row === 15 ) {
          this.box.material.color = new THREE.Color(0xff5552);
        }
        if( col === 11 && row === 15 ) {
          this.box.material.color = new THREE.Color(0xff5552);
        }

        this.box.position.set(col * BOX_SIZE + offsetX, -row * BOX_SIZE - offsetY, 0);
        this.scene.add(this.box);
      }
    }


    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    // const axesBarLength = 5.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}

