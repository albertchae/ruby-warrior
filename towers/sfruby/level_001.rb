#  --------
# |@   s  >|
#  --------

description "Welcome to the SF🌁Ruby secret experience room! Get to the stairs and fight all the monsters on your way."
tip "Call warrior.walk! to walk forward in the Player 'play_turn' method. Use warrior.feel.empty? to see if there is anything in front of you, and warrior.attack! to fight it. Remember, you can only do one action (ending in !) per turn."

time_bonus 20
ace_score 26
size 8, 1
stairs 7, 0

warrior 0, 0, :east do |u|
  u.add_abilities :walk!
  u.add_abilities :feel, :attack!
end

unit :sludge, 4, 0, :west
