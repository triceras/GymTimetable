import os
import json
import logging
import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from sqlalchemy.orm import joinedload
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity


# Initialize logging
logging.basicConfig(
    filename="gym_app.log", 
    level=logging.INFO, 
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Initialize SQLAlchemy and Marshmallow
db = SQLAlchemy()
ma = Marshmallow()

# Initialize JWT
jwt = JWTManager()

def validate_token(token):
    # You need to implement this function
    # It should validate the token and return the user
    # You can use a library like PyJWT to validate the token
    return None

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(base_dir, 'gym_classes.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "mysecretkey"
    jwt.init_app(app)

    db.init_app(app)
    ma.init_app(app)

    register_routes(app)

    with app.app_context():
        db.create_all()
        initialize_database()

    return app

# Models
class GymClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    occurrences = db.relationship("Occurrence", backref="gym_class", cascade="all, delete-orphan", lazy="joined")

    def __init__(self, name):
        self.name = name

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

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    member = db.relationship('Member', uselist=False, back_populates='user')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)  # Add this line
    membership_number = db.Column(db.String(20), unique=True, nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    member_since = db.Column(db.Date, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    user = db.relationship('User', back_populates='member')

    def __init__(self, name, username, membership_number, date_of_birth, member_since, user_id):
        self.name = name
        self.username = username  # Add this line
        self.membership_number = membership_number
        self.date_of_birth = date_of_birth
        self.member_since = member_since
        self.user_id = user_id

# Schemas
class GymClassSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = GymClass
        include_relationships = True
        load_instance = True
    occurrences = ma.Nested("OccurrenceSchema", many=True)

class OccurrenceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Occurrence
        include_relationships = True
        load_instance = True

class MemberSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Member
        include_fk = True

gym_class_schema = GymClassSchema()
gym_classes_schema = GymClassSchema(many=True)
class_occurrence_schema = OccurrenceSchema()
class_occurrences_schema = OccurrenceSchema(many=True)
member_schema = MemberSchema()

# Database initialization functions
def initialize_database():
    print("Starting database initialization...")
    try:
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        logger.info(f"Created tables: {tables}")

        logger.info("Initializing timetable...")
        initialize_timetable()
        logger.info("Initializing user table...")
        initialize_user_table()

        test_user = User.query.filter_by(username="admin").first()
        if test_user:
            logger.info(f"Test query successful. Found user: {test_user.username}")
        else:
            logger.info("Test query failed. No user found.")

        logger.info("Database initialization completed.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        raise

def initialize_timetable():
    try:
        logger.info("Loading timetable data from JSON file...")
        with open("timetable.json", "r") as f:
            timetable = json.load(f)
        for class_info in timetable:
            occurrences_data = class_info.pop("occurrences")
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
        logger.info("Timetable data loaded into the database.")
    except Exception as e:
        logger.error(f"Error initializing timetable: {e}")
        db.session.rollback()

def initialize_user_table():
    try:
        logger.info("Initializing user table...")
        sample_user = User(username="admin")
        sample_user.set_password("admin")
        db.session.add(sample_user)
        db.session.flush()

        sample_member = Member(
            name="Admin User",
            username="admin",
            membership_number="MEM001",
            date_of_birth=datetime.date(1990, 1, 1),
            member_since=datetime.date(2020, 1, 1),
            user_id=sample_user.id
        )
        db.session.add(sample_member)

        db.session.commit()
        logger.info(f"Added user: {sample_user.username} with associated member details")
    except Exception as e:
        logger.error(f"Error initializing user table: {e}")
        db.session.rollback()

def validate_token(token):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return user
    except Exception as e:
        print(f"Token validation error: {e}")
        return None

# Routes
def register_routes(app):
    @app.route("/api/login", methods=["POST"])
    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.json
        username = data.get("username")
        password = data.get("password")
        
        logger.info(f"Login attempt for user: {username}")

        user = User.query.filter_by(username=username).first()

        if user:
            logger.info(f"User found: {user.username}")
            if user.check_password(password):
                logger.info("Password check successful")
                member = Member.query.filter_by(user_id=user.id).first()
                if member:
                    access_token = create_access_token(identity=user.id)
                    member_data = member_schema.dump(member)
                    response = {
                        "success": True,
                        "message": "Login successful",
                        "member": member_data,
                        "token": access_token
                    }
                    logger.info(f"Login successful for user: {username}")
                    return jsonify(response), 200
                else:
                    logger.warning(f"Member details not found for user: {username}")
                    return jsonify({"success": False, "message": "Member details not found"}), 404
            else:
                logger.warning(f"Invalid password for user: {username}")
                return jsonify({"success": False, "message": "Invalid username or password"}), 401
        else:
            logger.warning(f"User not found: {username}")
            return jsonify({"success": False, "message": "Invalid username or password"}), 401

    @app.route("/api/classes", methods=["GET"])
    def get_classes():
        classes = GymClass.query.options(joinedload(GymClass.occurrences)).all()
        result = gym_classes_schema.dump(classes)
        logger.info("Classes fetched")
        return jsonify(result)

    @app.route("/api/classes/<int:class_id>", methods=["GET"])
    def get_class(class_id):
        gym_class = GymClass.query.get(class_id)
        if gym_class is None:
            return jsonify({"error": "Class not found"}), 404
        result = gym_class_schema.dump(gym_class)
        logger.info(f"Class {class_id} fetched")
        return jsonify(result)

    @app.route("/api/classes/schedule", methods=["POST"])
    def schedule_class():
        data = request.json
        occurrence_id = data.get('occurrence_id')

        occurrence = Occurrence.query.get(occurrence_id)
        if not occurrence:
            return jsonify({"success": False, "message": "Class not found"}), 404

        if occurrence.current_capacity >= occurrence.max_capacity:
            return jsonify({"success": False, "message": "Class is full"}), 400

        occurrence.current_capacity += 1
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Class scheduled successfully",
            "current_capacity": occurrence.current_capacity,
            "max_capacity": occurrence.max_capacity
        }), 200

    @app.route("/api/initialize", methods=["POST"])
    def initialize():
        try:
            initialize_database()
            return jsonify({"message": "Application initialized"})
        except Exception as e:
            print(f"Error during database initialization: {e}")
            return jsonify({"error": "Database initialization failed"}), 500

    @app.route("/api/member", methods=["GET"])
    @jwt_required()
    def get_member_details():
        current_user_id = get_jwt_identity()
        logger.info(f"Fetching member details for user ID: {current_user_id}")

        member = Member.query.filter_by(user_id=current_user_id).first()
        if not member:
            logger.warning(f"Member not found for user ID: {current_user_id}")
            return jsonify({"error": "Member not found"}), 404

        result = member_schema.dump(member)
        logger.info(f"Member details retrieved for user ID: {current_user_id}")
        return jsonify(result)

    @app.route("/api/validate-token", methods=["GET"])
    @jwt_required()
    def validate_token():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if user:
            return jsonify({"isValid": True, "user": {"id": user.id, "username": user.username}}), 200
        return jsonify({"isValid": False}), 401


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
