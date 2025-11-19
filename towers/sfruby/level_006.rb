#  -----------------
# |  CCCCCCCCCCC  >|
# | C  C  C  C  C  |
# |CCCCCCCCCCCCCCC |
# | C   C C C   C  |
# |  C  C C C  C   |
# |   C  CCC  C    |
# |    C  C  C     |
# |     C C C      |
# |      C C       |
# |@      C        |
#  -----------------

description "Several SF Ruby conference attendees are captivated in the shape of a ruby! Navigate through and rescue them all."
tip "Use warrior.feel.captive? to sense captives nearby. Remember to warrior.rescue! them, not attack them."

time_bonus 200
ace_score 1100
size 15, 10
stairs 14, 0

warrior 0, 9, :east do |u|
  u.add_abilities :walk!, :feel, :rescue!, :direction_of_stairs, :pivot!, :listen
end

# Row 0: CCCCCCCCCCC (positions 2-12)
unit :captive, 2, 0, :west
unit :captive, 3, 0, :west
unit :captive, 4, 0, :west
unit :captive, 5, 0, :west
unit :captive, 6, 0, :west
unit :captive, 7, 0, :west
unit :captive, 8, 0, :west
unit :captive, 9, 0, :west
unit :captive, 10, 0, :west
unit :captive, 11, 0, :west
unit :captive, 12, 0, :west

# Row 1: C  C  C  C  C (positions 1, 4, 7, 10, 13)
unit :captive, 1, 1, :west
unit :captive, 4, 1, :west
unit :captive, 7, 1, :west
unit :captive, 10, 1, :west
unit :captive, 13, 1, :west

# Row 2: CCCCCCCCCCCCCCC (positions 0-14)
unit :captive, 0, 2, :west
unit :captive, 1, 2, :west
unit :captive, 2, 2, :west
unit :captive, 3, 2, :west
unit :captive, 4, 2, :west
unit :captive, 5, 2, :west
unit :captive, 6, 2, :west
unit :captive, 7, 2, :west
unit :captive, 8, 2, :west
unit :captive, 9, 2, :west
unit :captive, 10, 2, :west
unit :captive, 11, 2, :west
unit :captive, 12, 2, :west
unit :captive, 13, 2, :west
unit :captive, 14, 2, :west

# Row 3: C   C C C   C (positions 1, 5, 7, 9, 13)
unit :captive, 1, 3, :west
unit :captive, 5, 3, :west
unit :captive, 7, 3, :west
unit :captive, 9, 3, :west
unit :captive, 13, 3, :west

# Row 4: C  C C C  C (positions 2, 5, 7, 9, 12)
unit :captive, 2, 4, :west
unit :captive, 5, 4, :west
unit :captive, 7, 4, :west
unit :captive, 9, 4, :west
unit :captive, 12, 4, :west

# Row 5: C  CCC  C (positions 3, 6, 7, 8, 11)
unit :captive, 3, 5, :west
unit :captive, 6, 5, :west
unit :captive, 7, 5, :west
unit :captive, 8, 5, :west
unit :captive, 11, 5, :west

# Row 6: C  C  C (positions 4, 7, 10)
unit :captive, 4, 6, :west
unit :captive, 7, 6, :west
unit :captive, 10, 6, :west

# Row 7: C C C (positions 5, 7, 9)
unit :captive, 5, 7, :west
unit :captive, 7, 7, :west
unit :captive, 9, 7, :west

# Row 8: C C (positions 6, 8)
unit :captive, 6, 8, :west
unit :captive, 8, 8, :west

# Row 9: C (position 7)
unit :captive, 7, 9, :west
