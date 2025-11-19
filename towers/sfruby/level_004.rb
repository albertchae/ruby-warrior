#  ---
# |>s |
# |s@s|
# | C |
#  ---

description "You climb up the stairs to find yourself in a large (2D) cellblock on Alcatraz! You feel slime on all sides. You're surrounded!"
tip "Call warrior.bind!(direction) to bind an enemy to keep him from attacking. Bound enemies look like captives. You can walk!, attack! etc in multiple directions (:forward, :left, :right, :backward). You are beginning this level facing east. You can call warrior.feel(direction).wall? to identify walls."
clue "Call warrior.feel(direction).enemy? to know if there is an enemy. Count the number of enemies around you. Bind an enemy if there are two or more."

time_bonus 50
ace_score 101
size 3, 3
stairs 0, 0

warrior 1, 1, :east do |u|
  u.add_abilities :bind!
end

unit :sludge, 1, 0, :west
unit :captive, 1, 2, :west
unit :sludge, 0, 1, :west
unit :sludge, 2, 1, :west
