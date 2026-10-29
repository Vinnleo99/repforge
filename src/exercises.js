const L=[
['Chest',['Bench Press|Barbell','Incline Bench Press|Barbell','Decline Bench Press|Barbell','Dumbbell Bench Press|Dumbbell','Incline Dumbbell Press|Dumbbell','Dumbbell Fly|Dumbbell','Cable Crossover|Cable','Chest Press|Machine','Push Up|Bodyweight','Chest Dip|Bodyweight']],
['Back',['Deadlift|Barbell','Bent Over Row|Barbell','Pull Up|Bodyweight','Chin Up|Bodyweight','Lat Pulldown|Cable','Seated Cable Row|Cable','Single Arm Dumbbell Row|Dumbbell','T-Bar Row|Barbell','Seated Row|Machine','Back Extension|Bodyweight']],
['Shoulders',['Overhead Press|Barbell','Seated Dumbbell Shoulder Press|Dumbbell','Arnold Press|Dumbbell','Lateral Raise|Dumbbell','Cable Lateral Raise|Cable','Front Raise|Dumbbell','Face Pull|Cable','Reverse Fly|Machine','Shoulder Press|Machine']],
['Biceps',['Barbell Curl|Barbell','Dumbbell Curl|Dumbbell','Hammer Curl|Dumbbell','Preacher Curl|Machine','Cable Curl|Cable','Concentration Curl|Dumbbell']],
['Triceps',['Triceps Pushdown|Cable','Overhead Triceps Extension|Cable','Skull Crusher|Barbell','Close Grip Bench Press|Barbell','Triceps Dip|Bodyweight','Dumbbell Kickback|Dumbbell']],
['Legs',['Squat|Barbell','Front Squat|Barbell','Leg Press|Machine','Romanian Deadlift|Barbell','Bulgarian Split Squat|Dumbbell','Walking Lunge|Dumbbell','Leg Extension|Machine','Lying Leg Curl|Machine','Seated Leg Curl|Machine','Hip Thrust|Barbell','Goblet Squat|Dumbbell','Standing Calf Raise|Machine','Seated Calf Raise|Machine','Hack Squat|Machine']],
['Core',['Plank|Bodyweight','Crunch|Bodyweight','Hanging Leg Raise|Bodyweight','Cable Crunch|Cable','Russian Twist|Bodyweight','Ab Wheel Rollout|Other']],
['Cardio',['Treadmill Run|Machine','Rowing Machine|Machine','Stationary Bike|Machine']]];
export const EXERCISES=L.flatMap(([m,xs])=>xs.map(s=>{const[n,e]=s.split('|');return{id:n.toLowerCase().replace(/[^a-z]+/g,'-'),name:n,muscle:m,equipment:e}}));
