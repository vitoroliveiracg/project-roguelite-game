import { describe, it, expect, vi } from 'vitest';
import SimpleSword from '../../../../../domain/ObjectModule/Items/Weapons/MeleeWeapons/SimpleSword';
import Scythe from '../../../../../domain/ObjectModule/Items/Weapons/MeleeWeapons/Scythe';
import SimpleStaff from '../../../../../domain/ObjectModule/Items/Weapons/RangedWeapons/Staffs/SimpleStaff';
import Gun from '../../../../../domain/ObjectModule/Items/Weapons/RangedWeapons/Gun';
import FishingRod from '../../../../../domain/ObjectModule/Items/Weapons/RangedWeapons/FishingRod';

describe('Concrete Weapons Instantiation', () => {
  // Anula os modificadores de Roguelite para atestar os construtores em estado puro
  vi.spyOn(Math, 'random').mockReturnValue(1.0);

  it('SimpleSword deve pertencer à classe melee e desbloquear Guerreiro', () => {
    const sword = new SimpleSword();
    expect(sword.weaponType).toBe('melee');
    expect(sword.unlocksClass).toBe('Guerreiro');
  });

  it('Scythe deve pertencer à classe melee, gerar scytheSlash e desbloquear Necromante', () => {
    const scythe = new Scythe();
    expect(scythe.weaponType).toBe('melee');
    expect(scythe.unlocksClass).toBe('Necromante');
  });

  it('SimpleStaff deve gerar magicMissile e desbloquear Mago', () => {
    const staff = new SimpleStaff();
    expect(staff.projectileType).toBe('magicMissile');
    expect(staff.unlocksClass).toBe('Mago');
  });

  it('Gun deve pertencer ao tipo gun, gerar simpleBullet e desbloquear Gunslinger', () => {
    const gun = new Gun();
    expect(gun.weaponType).toBe('gun');
    expect(gun.projectileType).toBe('simpleBullet');
    expect(gun.unlocksClass).toBe('Gunslinger');
  });

  it('FishingRod deve gerar fishingHook e desbloquear Pescador', () => {
    const rod = new FishingRod();
    expect(rod.projectileType).toBe('fishingHook');
    expect(rod.unlocksClass).toBe('Pescador');
  });
});