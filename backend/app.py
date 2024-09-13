import os
import json
import logging
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from sqlalchemy.orm import joinedload

# Initialize logging
logging.basicConfig(filename="gym_app.log", level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

base_dir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(base_dir, 'gym_classes.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy and Marshmallow
db = SQLAlchemy(app)
ma = Marshmallow(app)
# Import statements remain the same

# Model for gym classes
# Model for gym classes
class GymClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    occurrences = db.relationship("Occurrence", backref="gym_class", cascade="all, delete-orphan", lazy="joined")

    def __init__(self, name):
        self.name = name

# Model for occurrences
class Occurrence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_class_id = db.Column(db.Integer, db.ForeignKey("gym_class.id"), nullable=False)
    day = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(20), nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    current_capacity = db.Column(db.Integer, nullable=False)

    def __init__(self, gym_class_id, day, time, max_capacity, current_capacity):
        self.gym_class_id = gym_class_id
        self.day = day
        self.time = time
        self.max_capacity = max_capacity
        self.current_capacity = current_capacity

# Schema for gym classes
class GymClassSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = GymClass
        include_relationships = True
        load_instance = True

    occurrences = ma.Nested("OccurrenceSchema", many=True)

# Schema for occurrences
class OccurrenceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Occurrence
        include_relationships = True
        load_instance = True

gym_class_schema = GymClassSchema()
gym_classes_schema = GymClassSchema(many=True)
class_occurrence_schema = OccurrenceSchema()
class_occurrences_schema = OccurrenceSchema(many=True)

# Initialize the database and populate with dummy timetable (update this part to add occurrences)
def initialize_app():
    logger.info("Initializing the application...")
    # Load timetable data, populate the database, etc.
    logger.info("Timetable data loaded successfully.")

    # Drop all tables
    db.drop_all()

    # Create all tables
    db.create_all()

    try:
        logging.info("Loading timetable data from JSON file...")
        with open("timetable.json", "r") as f:
            timetable = json.load(f)
            logger.info(f"Timetable data: {timetable}")
    except FileNotFoundError:
        logging.error("Failed to load timetable.json file")
        return

    logging.info(f"Timetable data: {timetable}")

    for class_info in timetable:
        occurrences_data = class_info.pop("occurrences")
        logging.info(f"{class_info['name']} occurrences data: {occurrences_data}")

        new_class = GymClass(name=class_info['name'])
        db.session.add(new_class)
        db.session.flush()

        occurrences = []
        for occurrence_info in occurrences_data:
            new_occurrence = Occurrence(
                gym_class_id=new_class.id,
                day=occurrence_info['day'],
                time=occurrence_info['time'],
                max_capacity=occurrence_info['max_capacity'],
                current_capacity=occurrence_info['current_capacity']
            )

            occurrences.append(new_occurrence)

        new_class.occurrences = occurrences
        db.session.commit()

    logging.info("Database initialized and populated with timetable data")

    # Log class and occurrences information
    all_classes = GymClass.query.options(joinedload(GymClass.occurrences)).all()
    for gym_class in all_classes:
        logging.info(f"Class {gym_class.id} - {gym_class.name} with {len(gym_class.occurrences)} occurrences")
        for occurrence in gym_class.occurrences:
            logging.info(
                f"Occurrence {occurrence.id}: {occurrence.day}, {occurrence.time}, capacity: {occurrence.max_capacity}"
            )

# Routes
@app.route("/api/classes", methods=["GET"])
def get_classes():
    classes = GymClass.query.options(joinedload(GymClass.occurrences)).all()
    result = gym_classes_schema.dump(classes)
    logging.info("Classes fetched")
    return jsonify(result)

@app.route("/api/classes/<int:class_id>", methods=["GET"])
def get_class(class_id):
    gym_class = GymClass.query.get(class_id)
    if gym_class is None:
        return jsonify({"error": "Class not found"}), 404
    result = gym_class_schema.dump(gym_class)
    logging.info(f"Class {class_id} fetched")
    return jsonify(result)

@app.route("/api/classes/schedule", methods=["POST"])
def schedule_class():
    occurrence_id = request.json["occurrence_id"]

    occurrence = db.session.query(Occurrence).get(occurrence_id)
    if occurrence is None:
        return jsonify({"error": "Occurrence not found"}), 404

    if occurrence.current_capacity < occurrence.max_capacity:
        occurrence.current_capacity += 1
        db.session.commit()
        logging.info(f"Occurrence {occurrence_id} scheduled")
        return jsonify({"message": "Class scheduled successfully"})
    else:
        logging.info(f"Failed to schedule occurrence {occurrence_id}: Class is fully booked")
        return jsonify({"error": "Class is fully booked"}), 400


@app.route("/api/reset", methods=["POST"])
def reset_current_capacity():
    '''
    Reset current capacity for all occurrences
    :return:
    
    reset_current_capacity()
    return jsonify({"message": "Current capacity reset for all occurrences"})
    '''
    occurrences = Occurrence.query.all()
    for occurrence in occurrences:
        occurrence.current_capacity = 0
    db.session.commit()
    logging.info("Current capacity reset for all occurrences")
    
    return jsonify({"message": "Current capacity reset for all occurrences"})

if __name__ == '__main__':
    with app.app_context():
        initialize_app()
    app.run(debug=True)
