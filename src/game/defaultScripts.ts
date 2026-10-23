export interface ScriptFile {
  name: string;
  code: string;
  description: string;
}

export const DEFAULT_FILES: ScriptFile[] = [
  {
    name: 'main.py',
    description: 'Basic continuous farming loop',
    code: `# The Farmer Was Replaced
# Welcome to your automated farm!
# Write Python-like code to control your drone.

while True:
    if can_harvest():
        harvest()
    move(North)
`,
  },
  {
    name: 'farm_grid.py',
    description: 'Serpentine grid traversal across all tiles',
    code: `# Automated Grid Sweeper
# Traverses every cell on your farm regardless of size!

while True:
    for x in range(get_world_size()):
        for y in range(get_world_size()):
            if can_harvest():
                harvest()
            move(North)
        move(East)
`,
  },
  {
    name: 'crops.py',
    description: 'Multi-crop planner: Bushes, Carrots & Hay',
    code: `# Multi-Crop Strategy
# Column 0: Wood (Bushes)
# Column 1: Carrots (requires Soil)
# Other columns: Grass

while True:
    x = get_pos_x()
    
    if can_harvest():
        harvest()
        
    if x == 0:
        plant(Entities.Bush)
    elif x == 1:
        if get_ground_type() != Grounds.Soil:
            till()
        plant(Entities.Carrot)
    else:
        plant(Entities.Grass)
        
    move(North)
    if get_pos_y() == 0:
        move(East)
`,
  },
  {
    name: 'mega_pumpkins.py',
    description: 'Fuses pumpkins into huge Mega-Pumpkins',
    code: `# Mega-Pumpkin Farm
# Tills soil and plants pumpkins in adjacent grids.
# Fully grown adjacent pumpkins automatically fuse!

while True:
    if get_ground_type() != Grounds.Soil:
        till()
        
    if can_harvest():
        harvest()
    else:
        plant(Entities.Pumpkin)
        
    move(East)
    if get_pos_x() == 0:
        move(North)
`,
  },
  {
    name: 'sunflowers.py',
    description: 'Measures petal count to harvest Power',
    code: `# Sunflower Solar Farm
# Sunflowers have between 7 and 15 petals.
# Use measure() to find and harvest the highest ones for Power!

while True:
    if get_ground_type() != Grounds.Soil:
        till()
    plant(Entities.Sunflower)
    
    petals = measure()
    if petals >= 12 and can_harvest():
        harvest()
        
    move(East)
    if get_pos_x() == 0:
        move(North)
`,
  },
  {
    name: 'cactus_sort.py',
    description: 'Bubble sort cactus field using swap() for n^2 rewards',
    code: `# Cactus Sorting Automation
# Cacti grow in sizes 0 to 9.
# Swap adjacent cacti so smaller are South/West and larger are North/East!

while True:
    if get_ground_type() != Grounds.Soil:
        till()
    if get_entity_type() != Entities.Cactus:
        plant(Entities.Cactus)
        
    cur_size = measure()
    # Check East neighbor and swap if out of order
    move(East)
    east_size = measure()
    move(West)
    
    if cur_size > east_size:
        swap(East)
        
    move(North)
    if get_pos_y() == 0:
        move(East)
`,
  },
  {
    name: 'flip_dance.py',
    description: 'Drone aerobatics celebration',
    code: `# Drone Celebration
# Show off your drone's aerial acrobatics!

for i in range(4):
    move(North)
    do_a_flip()
    move(East)
    do_a_flip()
`,
  },
];

export interface TutorialLesson {
  id: number;
  title: string;
  objective: string;
  instructions: string;
  starterCode: string;
  solutionHint: string;
}

export const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: 1,
    title: '1. The First Harvest',
    objective: 'Harvest your first grass tile to gain Hay.',
    instructions:
      'In The Farmer Was Replaced, your drone can perform physical actions. Call `harvest()` to reap the grass.',
    starterCode: `# Lesson 1: Call harvest() to harvest grass!
harvest()
`,
    solutionHint: 'Simply write `harvest()` and press Run.',
  },
  {
    id: 2,
    title: '2. Continuous Loops',
    objective: 'Keep harvesting forever using a while loop.',
    instructions:
      'Instead of running your script once, use `while True:` to keep the drone active continuously.',
    starterCode: `while True:
    if can_harvest():
        harvest()
`,
    solutionHint: 'The `while True:` loop never stops, and `can_harvest()` ensures grass is grown.',
  },
  {
    id: 3,
    title: '3. Moving on the Grid',
    objective: 'Move across tiles with move(North) and move(East).',
    instructions:
      'Move your drone in 4 cardinal directions: `move(North)`, `move(East)`, `move(South)`, and `move(West)`. Farm grids wrap around!',
    starterCode: `while True:
    if can_harvest():
        harvest()
    move(North)
`,
    solutionHint: 'Moving North at the top edge will wrap around to the bottom!',
  },
  {
    id: 4,
    title: '4. Planting Bushes for Wood',
    objective: 'Plant bushes using plant(Entities.Bush) to gather Wood.',
    instructions:
      'Different crops yield different crafting resources. Bushes yield Wood, which is required for advanced upgrades.',
    starterCode: `while True:
    if can_harvest():
        harvest()
    plant(Entities.Bush)
    move(North)
`,
    solutionHint: 'Use `plant(Entities.Bush)` after harvesting.',
  },
  {
    id: 5,
    title: '5. Soil & Carrots',
    objective: 'Till the ground into soil and grow Carrots.',
    instructions:
      'Carrots cannot grow on grassland! You must call `till()` to cultivate the earth into `Grounds.Soil` before calling `plant(Entities.Carrot)`.',
    starterCode: `while True:
    if get_ground_type() != Grounds.Soil:
        till()
    if can_harvest():
        harvest()
    plant(Entities.Carrot)
    move(East)
`,
    solutionHint: 'Check `get_ground_type() != Grounds.Soil` and `till()`.',
  },
  {
    id: 6,
    title: '6. Irrigation & Water Tanks',
    objective: 'Moisten soil to boost crop growth speed 3x.',
    instructions:
      'Watered soil causes plants to grow three times faster! Check `get_water()` and use `use_item(Items.Water)`.',
    starterCode: `while True:
    if get_water() < 0.3:
        use_item(Items.Water)
    if can_harvest():
        harvest()
    move(North)
`,
    solutionHint: 'Keep moisture levels above 0.3 with `use_item(Items.Water)`.',
  },
];
