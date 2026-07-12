'use strict';

/* ============================================================
   ボス定義データ（エンジン本体: index.html）

   ボスを追加するには、この配列にオブジェクトを1つ足す。

   ■ 基本パラメータ
     id / name     : 識別子 / 表示名
     hp            : 最大HP
     postureMax    : 体幹（スタッガー）ゲージの最大値
     scale         : 骨格の大きさ（1.0 = 人間サイズ）
     swordLen      : 剣の長さ（0なら素手）
     walkSpeed / strafeSpeed / turnRate : 移動・旋回速度
     engageDist    : この距離以内なら攻撃を開始する
     cooldownMin / cooldownRand : 攻撃後の待ち時間（最小値 + 乱数幅）

   ■ phase2（HP減少で第2形態）
     hpRatio   : この割合以下で第2形態へ
     speedMult / dmgMult : 行動速度・ダメージ倍率
     combo     : { after, queue, chance } afterの攻撃後、確率で queue を連続発動

   ■ ai: 距離帯ごとの攻撃選択（minDist以上で最初に一致した行を使用）
     w = 攻撃名: 重み

   ■ attacks: 攻撃ごとの定義
     dur     : 全体時間（秒）
     dmg     : ダメージ
     teleEnd : 予備動作の終了時刻（ここまで地面に赤い予告を表示）
     windows : 判定時間帯 [{t0, t1, shape, move?, dmg?}]
               shape = {type:'rect', w, len} または {type:'sector', r, inner, half}
               （half に 3.15 を指定すると全周＝円形の判定になる）
               move  = 指定すると判定中その速度で前進（突進用）
               dmg   = 個別ダメージ（省略時は攻撃全体の dmg）
     leap    : {t0, t1, height} 跳躍。t0の時点のプレイヤー位置めがけて
               t1に着地する。予告円は着地点に表示される（teleEnd = t1 推奨）
     spin    : {t0, t1, turns, move?} 回転斬り。t0〜t1で turns 回転しながら
               開始時の向きへ move の速度で移動する
     strikes : 落雷 [{t, at, delay, r, dmg}, ...]
               t の時点の対象位置（at: 'player' | 'boss'）をロックし、
               delay 秒間予告円を出してから半径 r に落雷（パリイ不可・ガード可）
               dmg: 0 なら演出のみ（着地の雷爆発など）
   ■ style の追加オプション
     spear:true  = 武器を長槍にする / storm:true = 第2形態で武器が雷を纏う
     bodyColor / armorColor = 体・鎧の色（'#rrggbb'）
     frames  : ポーズのキーフレーム [[時刻, ポーズ], ...]
               ポーズは部分指定でよい（エンジン側で既定値が補完される）
               lean(前傾) twist(捻り) crouch(屈み)
               rp/ry/re: 右腕の前後/開き/肘  lp/ly/le: 左腕
               sp/sy: 剣の上下角/左右角
   ============================================================ */

const BOSS_DATA = [
  {
    id: 'gram',
    name: 'Gram, Knight of Bones', // 骸ノ騎士 グラム
    hp: 7,
    postureMax: 100,
    scale: 2.7,
    swordLen: 2.6,
    model: 'models/GramBoss.glb', // Mixamo (統合glb・大剣使い)
    modelHeight: 4.6,
    clips: { idle: 'Idle', walk: 'Walk', intro: 'Roar', stagger: 'Stagger', dead: 'Death' },
    walkSpeed: 2.3,
    strafeSpeed: 1.1,
    turnRate: 2.6,
    engageDist: 8.5,
    cooldownMin: 0.7,
    cooldownRand: 0.9,
    phase2: {
      hpRatio: 0.5,
      speedMult: 1.22,
      dmgMult: 1.15,
      combo: { after: 'sweep', queue: ['overhead'], chance: 0.45 }
    },
    style: { horns: true, pauldrons: true, eye: '#ff7040', eyePhase2: '#ff3820', tint: '#8a8f9e' },
    ai: [
      { minDist: 7,   w: { charge: 0.35, leap: 0.45, sweep: 0.2 } },
      { minDist: 4.5, w: { charge: 0.3, leap: 0.2, overhead: 0.25, sweep: 0.25 } },
      { minDist: 0,   w: { overhead: 0.3, sweep: 0.3, spin: 0.25, charge: 0.15 } }
    ],
    attacks: {
      overhead: { // 振り下ろし
        clip: 'Slash',
        dur: 2.1, dmg: 42, teleEnd: 0.86,
        windows: [{ t0: 0.87, t1: 1.02, shape: { type: 'rect', w: 2.4, len: 4.4 } }],
        frames: [
          [0,    {}],
          [0.55, { rp: 2.7, re: 0.25, sp: 1.9, sy: 0.1, lean: -0.18, lp: 1.8, le: 0.4 }],
          [0.86, { rp: 2.75, re: 0.22, sp: 2.0, sy: 0.08, lean: -0.22, lp: 1.85, le: 0.4 }],
          [0.98, { rp: 0.55, re: 0.1, sp: -1.05, sy: 0, lean: 0.55, crouch: 0.18, lp: 0.4, le: 0.3 }],
          [1.4,  { rp: 0.5, re: 0.15, sp: -1.0, sy: 0.05, lean: 0.5, crouch: 0.15 }],
          [2.1,  {}]
        ]
      },
      sweep: { // 横薙ぎ
        clip: 'Swipe',
        dur: 2.0, dmg: 30, teleEnd: 0.78,
        windows: [{ t0: 0.79, t1: 1.04, shape: { type: 'sector', r: 4.8, inner: 0.7, half: 1.75 } }],
        frames: [
          [0,    {}],
          [0.6,  { twist: -0.95, sy: -1.6, sp: 0.12, rp: 0.95, ry: 0.85, re: 0.25 }],
          [0.78, { twist: -1.0, sy: -1.7, sp: 0.12, rp: 1.0, ry: 0.9, re: 0.22 }],
          [1.02, { twist: 0.95, sy: 1.5, sp: 0.05, rp: 0.95, ry: 0.8, re: 0.25, lean: 0.12 }],
          [1.45, { twist: 0.6, sy: 1.1, sp: -0.2, rp: 0.7 }],
          [2.0,  {}]
        ]
      },
      charge: { // 突進突き
        clip: 'Punch',
        dur: 2.3, dmg: 34, teleEnd: 0.7,
        windows: [{ t0: 0.71, t1: 1.15, shape: { type: 'rect', w: 2.2, len: 3.2 }, move: 13 }],
        frames: [
          [0,    {}],
          [0.5,  { lean: 0.28, sp: 0.05, sy: 0.75, rp: 0.75, ry: 0.2, re: 0.15 }],
          [0.7,  { lean: 0.3, sp: 0.05, sy: 0.8, rp: 0.8, ry: 0.2, re: 0.12 }],
          [0.8,  { lean: 0.55, sp: 0, sy: 0, rp: 1.55, ry: 0.05, re: 0.05, crouch: 0.1 }],
          [1.25, { lean: 0.5, sp: 0, sy: 0.05, rp: 1.5, re: 0.08 }],
          [2.3,  {}]
        ]
      },
      leap: { // 跳躍斬り（プレイヤーの位置へ飛び込んで叩きつける）
        clip: 'JumpAttack',
        dur: 2.7, dmg: 46, teleEnd: 1.35,
        leap: { t0: 0.7, t1: 1.35, height: 4.5 },
        windows: [{ t0: 1.36, t1: 1.55, shape: { type: 'sector', r: 3.1, inner: 0, half: 3.15 } }],
        frames: [
          [0,    {}],
          [0.4,  { crouch: 0.5, lean: 0.3, rp: 1.2, sp: 1.3, sy: 0.3 }],
          [0.7,  { crouch: 0.6, lean: 0.35, rp: 2.4, sp: 1.8, sy: 0.15, lp: 1.2 }],
          [0.95, { crouch: 0.15, lean: 0.1, rp: 2.75, sp: 2.0, sy: 0.1, lp: 1.6, le: 0.3 }],
          [1.35, { crouch: 0.3, lean: 0.55, rp: 0.6, sp: -1.1, sy: 0, lp: 0.5 }],
          [1.95, { crouch: 0.25, lean: 0.5, rp: 0.55, sp: -1.0, sy: 0.05 }],
          [2.7,  {}]
        ]
      },
      spin: { // 回転斬り（2回転しながら前進する全周攻撃）
        clip: 'Spin',
        dur: 2.6, dmg: 24, teleEnd: 0.75,
        spin: { t0: 0.75, t1: 1.75, turns: 2, move: 2.0 },
        windows: [
          { t0: 0.78, t1: 1.25, dmg: 24, shape: { type: 'sector', r: 4.0, inner: 0.6, half: 3.15 } },
          { t0: 1.26, t1: 1.75, dmg: 24, shape: { type: 'sector', r: 4.0, inner: 0.6, half: 3.15 } }
        ],
        frames: [
          [0,    {}],
          [0.5,  { twist: -1.1, sy: -1.8, sp: 0.2, rp: 1.1, ry: 1.0, crouch: 0.15 }],
          [0.75, { twist: -1.2, sy: -1.9, sp: 0.15, rp: 1.2, ry: 1.1, crouch: 0.2 }],
          [0.9,  { twist: 0, sy: 0.35, sp: 0.1, rp: 1.3, ry: 1.3, lp: 1.1, ly: 1.2, lean: 0.1, crouch: 0.15 }],
          [1.75, { twist: 0, sy: 0.4, sp: 0.1, rp: 1.25, ry: 1.25, lp: 1.05, ly: 1.15, crouch: 0.2 }],
          [2.1,  { crouch: 0.3, lean: 0.35, rp: 0.6, sp: -0.9, sy: 0.3 }],
          [2.6,  {}]
        ]
      }
    }
  },

  // ============================================================
  // 2体目: 雷ノ王 ヴォルガ（オリジナルボス）
  // 長槍と雷を操る。超高空からの急襲・長距離の突進突き・落雷が持ち味
  // ============================================================
  {
    id: 'volga',
    name: 'Volga, King of Thunder', // 雷ノ王 ヴォルガ
    hp: 950,
    postureMax: 110,
    scale: 2.9,
    swordLen: 3.4,
    model: 'models/VolgaBoss.glb', // Mixamo (統合glb・Mutant)
    modelHeight: 4.9,
    clips: { idle: 'Idle', walk: 'Walk', intro: 'Roar', stagger: 'Hurt', dead: 'Death' },
    walkSpeed: 2.6,
    strafeSpeed: 1.3,
    turnRate: 3.0,
    engageDist: 11,
    cooldownMin: 0.6,
    cooldownRand: 0.8,
    phase2: {
      hpRatio: 0.5,
      speedMult: 1.18,
      dmgMult: 1.12,
      combo: { after: 'thrust', queue: ['nova'], chance: 0.35 }
    },
    style: {
      pauldrons: true, horns: false, crown: true,
      eye: '#9fd8ff', eyePhase2: '#d8f2ff',
      spear: true, storm: true,
      bodyColor: '#b9c2d4', armorColor: '#2c3a5e',
      tint: '#9296ac'
    },
    ai: [
      { minDist: 9, w: { thrust: 0.45, skyfall: 0.35, bolt3: 0.2 } },
      { minDist: 5, w: { thrust: 0.3, skyfall: 0.2, bolt3: 0.2, sweep: 0.3 } },
      // 密着時は落雷詠唱(bolt3)を使わない（棒立ち詠唱が殴り放題になるため）
      { minDist: 0, w: { sweep: 0.45, nova: 0.35, thrust: 0.2 } }
    ],
    attacks: {
      thrust: { // 長距離の突進突き
        clip: 'Thrust',
        dur: 2.6, dmg: 40, teleEnd: 0.7,
        windows: [{ t0: 0.72, t1: 1.2, shape: { type: 'rect', w: 2.0, len: 4.2 }, move: 19 }],
        frames: [
          [0,    {}],
          [0.5,  { lean: 0.25, rp: 0.9, ry: 0.15, re: 0.1, sp: 0.1, sy: 0.65, twist: -0.3 }],
          [0.7,  { lean: 0.3, rp: 1.0, ry: 0.1, re: 0.05, sp: 0.05, sy: 0.75, twist: -0.35 }],
          [0.85, { lean: 0.6, rp: 1.6, ry: 0.05, re: 0.02, sp: 0, sy: 0, twist: 0.15, crouch: 0.1 }],
          [1.4,  { lean: 0.55, rp: 1.55, sp: 0, sy: 0.05 }],
          [2.6,  {}]
        ]
      },
      skyfall: { // 超高空からの急襲（画面外まで跳び、着地点に雷爆発）
        clip: 'JumpAttack',
        dur: 3.7, dmg: 50, teleEnd: 2.1,
        leap: { t0: 0.85, t1: 2.1, height: 13 },
        windows: [{ t0: 2.11, t1: 2.3, shape: { type: 'sector', r: 3.5, inner: 0, half: 3.15 } }],
        strikes: [{ t: 2.1, at: 'boss', delay: 0, r: 0, dmg: 0 }],
        frames: [
          [0,    {}],
          [0.5,  { crouch: 0.55, lean: 0.3, rp: 1.3, sp: 1.2, sy: 0.4 }],
          [0.85, { crouch: 0.65, lean: 0.4, rp: 2.2, sp: 1.7, sy: 0.2 }],
          [1.3,  { crouch: 0.2, lean: -0.1, rp: 2.8, sp: 2.1, sy: 0.1, lp: 1.4 }],
          [2.1,  { crouch: 0.35, lean: 0.6, rp: 0.7, sp: -1.2, sy: 0 }],
          [2.8,  { crouch: 0.3, lean: 0.55, rp: 0.65, sp: -1.1 }],
          [3.7,  {}]
        ]
      },
      bolt3: { // 両手で印を結び、プレイヤーを追う三連落雷
        clip: 'Cast',
        dur: 3.4, dmg: 30, teleEnd: 0.55,
        windows: [],
        strikes: [
          { t: 0.55, at: 'player', delay: 0.85, r: 2.4, dmg: 30 },
          { t: 1.05, at: 'player', delay: 0.85, r: 2.4, dmg: 30 },
          { t: 1.55, at: 'player', delay: 0.85, r: 2.4, dmg: 30 }
        ],
        frames: [
          [0,    {}],
          [0.45, { rp: 2.9, sp: 2.2, sy: 0.1, lean: -0.15, lp: 0.8 }],
          [2.4,  { rp: 2.85, sp: 2.15, sy: 0.12, lean: -0.12, lp: 0.75 }],
          [3.4,  {}]
        ]
      },
      nova: { // 自分を中心とした雷光の放射
        clip: 'Punch',
        dur: 2.5, dmg: 36, teleEnd: 0.95,
        windows: [{ t0: 0.97, t1: 1.12, shape: { type: 'sector', r: 4.0, inner: 0, half: 3.15 } }],
        strikes: [{ t: 0.95, at: 'boss', delay: 0, r: 0, dmg: 0 }],
        frames: [
          [0,    {}],
          [0.6,  { crouch: 0.45, lean: 0.25, rp: 0.6, lp: 0.6, sp: -0.8, sy: 0.4 }],
          [0.95, { crouch: 0.5, lean: 0.3, rp: 0.5, lp: 0.5, sp: -0.9, sy: 0.4 }],
          [1.15, { crouch: 0.05, lean: -0.2, rp: 1.5, ry: 1.3, lp: 1.5, ly: 1.3, sp: 0.6, sy: 0.9 }],
          [1.8,  { rp: 1.2, ry: 1.0, lp: 1.2, ly: 1.0, lean: -0.1 }],
          [2.5,  {}]
        ]
      },
      sweep: { // 薙ぎ払い（リーチ長め）
        clip: 'Swipe',
        dur: 2.1, dmg: 32, teleEnd: 0.7,
        windows: [{ t0: 0.72, t1: 0.98, shape: { type: 'sector', r: 5.4, inner: 0.8, half: 1.7 } }],
        frames: [
          [0,    {}],
          [0.55, { twist: -0.95, sy: -1.6, sp: 0.12, rp: 0.95, ry: 0.85, re: 0.25 }],
          [0.7,  { twist: -1.0, sy: -1.7, sp: 0.12, rp: 1.0, ry: 0.9, re: 0.22 }],
          [0.95, { twist: 0.95, sy: 1.5, sp: 0.05, rp: 0.95, ry: 0.8, re: 0.25, lean: 0.12 }],
          [1.5,  { twist: 0.6, sy: 1.1, sp: -0.2, rp: 0.7 }],
          [2.1,  {}]
        ]
      }
    }
  }
];
