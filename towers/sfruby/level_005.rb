#  ---------------------------
# |    S               S     |
# |    S               S     |
# |    S               S     |
# |   SSS             SSS    |
# |  S S S           S S S   |
# | S  S  S         S  S  S  |
# |S   S   S       S   S   S |
# |    S    S     S    S     |
# |    S     S   S     S     |
# |    S      S S      S     |
# |@SSSSSSSSSSSSSSSSSSSSSSSS>|
#  ---------------------------

description "You managed to escape The Rock and swim over to the Golden Gate Bridge. The fog rolls in as you find the bridge is covered in sludge. Defeat them all and cross the bridge, San Francisco awaits on the other side."
tip "Navigate the towers and cables using warrior.listen and warrior.pivot! to thoroughly clean the bridge. Use warrior.direction_of_stairs to find your way to the exit."

time_bonus 250
ace_score 1350
size 25, 11
stairs 24, 10

warrior 0, 10, :east do |u|
  u.add_abilities :listen, :direction_of_stairs, :pivot!
end

# Row 0: Tower tops (positions 4, 20)
unit :thick_sludge, 4, 0, :west
unit :thick_sludge, 20, 0, :west

# Row 1: Towers (positions 4, 20)
unit :thick_sludge, 4, 1, :west
unit :thick_sludge, 20, 1, :west

# Row 2: Towers (positions 4, 20)
unit :thick_sludge, 4, 2, :west
unit :thick_sludge, 20, 2, :west

# Row 3: Tower bases (positions 3,4,5 and 19,20,21)
unit :thick_sludge, 3, 3, :west
unit :thick_sludge, 4, 3, :west
unit :thick_sludge, 5, 3, :west
unit :thick_sludge, 19, 3, :west
unit :thick_sludge, 20, 3, :west
unit :thick_sludge, 21, 3, :west

# Row 4: Cables (positions 2,4,6 and 18,20,22)
unit :thick_sludge, 2, 4, :west
unit :thick_sludge, 4, 4, :west
unit :thick_sludge, 6, 4, :west
unit :thick_sludge, 18, 4, :west
unit :thick_sludge, 20, 4, :west
unit :thick_sludge, 22, 4, :west

# Row 5: Cables (positions 1,4,7 and 17,20,23)
unit :thick_sludge, 1, 5, :west
unit :thick_sludge, 4, 5, :west
unit :thick_sludge, 7, 5, :west
unit :thick_sludge, 17, 5, :west
unit :thick_sludge, 20, 5, :west
unit :thick_sludge, 23, 5, :west

# Row 6: Cables (positions 0,4,8 and 16,20,24)
unit :thick_sludge, 0, 6, :west
unit :thick_sludge, 4, 6, :west
unit :thick_sludge, 8, 6, :west
unit :thick_sludge, 16, 6, :west
unit :thick_sludge, 20, 6, :west
unit :thick_sludge, 24, 6, :west

# Row 7: Cables drooping (positions 4,9,15,20)
unit :thick_sludge, 4, 7, :west
unit :thick_sludge, 9, 7, :west
unit :thick_sludge, 15, 7, :west
unit :thick_sludge, 20, 7, :west

# Row 8: Cables drooping (positions 4,10,14,20)
unit :thick_sludge, 4, 8, :west
unit :thick_sludge, 10, 8, :west
unit :thick_sludge, 14, 8, :west
unit :thick_sludge, 20, 8, :west

# Row 9: Cables meeting (positions 4,11,13,20)
unit :thick_sludge, 4, 9, :west
unit :thick_sludge, 11, 9, :west
unit :thick_sludge, 13, 9, :west
unit :thick_sludge, 20, 9, :west

# Row 10: Bridge deck (positions 1-24, leaving 0 for warrior)
unit :thick_sludge, 1, 10, :west
unit :thick_sludge, 2, 10, :west
unit :thick_sludge, 3, 10, :west
unit :thick_sludge, 4, 10, :west
unit :thick_sludge, 5, 10, :west
unit :thick_sludge, 6, 10, :west
unit :thick_sludge, 7, 10, :west
unit :thick_sludge, 8, 10, :west
unit :thick_sludge, 9, 10, :west
unit :thick_sludge, 10, 10, :west
unit :thick_sludge, 11, 10, :west
unit :thick_sludge, 12, 10, :west
unit :thick_sludge, 13, 10, :west
unit :thick_sludge, 14, 10, :west
unit :thick_sludge, 15, 10, :west
unit :thick_sludge, 16, 10, :west
unit :thick_sludge, 17, 10, :west
unit :thick_sludge, 18, 10, :west
unit :thick_sludge, 19, 10, :west
unit :thick_sludge, 20, 10, :west
unit :thick_sludge, 21, 10, :west
unit :thick_sludge, 22, 10, :west
unit :thick_sludge, 23, 10, :west
