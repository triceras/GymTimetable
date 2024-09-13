import os
import json
import logging
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from sqlalchemy.orm import joinedload
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, create_refresh_token


from datetime import date


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

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"], "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}})

    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(base_dir, 'gym_classes.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "mysecretkey"
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
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
    instructor = db.Column(db.String(100), nullable=True)
    occurrences = db.relationship('Occurrence', back_populates='gym_class', cascade="all, delete-orphan")

class Occurrence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_class_id = db.Column(db.Integer, db.ForeignKey('gym_class.id'), nullable=False)
    day = db.Column(db.String(10), nullable=False)
    time = db.Column(db.String(5), nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    current_capacity = db.Column(db.Integer, nullable=False)
    gym_class = db.relationship('GymClass', back_populates='occurrences')

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
    is_admin = db.Column(db.Boolean, default=False)
    member = db.relationship('Member', uselist=False, back_populates='user', cascade="all, delete-orphan")

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

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    occurrence_id = db.Column(db.Integer, db.ForeignKey('occurrence.id'), nullable=False)
    booking_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship('User', backref=db.backref('bookings', lazy=True))
    occurrence = db.relationship('Occurrence', backref=db.backref('bookings', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "occurrence_id": self.occurrence_id,
            "booking_date": self.booking_date,
            "class_name": self.occurrence.gym_class.name,
            "date": self.occurrence.day,
            "time": self.occurrence.time
        }

# Schemas
class GymClassSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = GymClass
        include_relationships = True
        load_instance = True
    occurrences = ma.Nested("OccurrenceSchema", many=True)
    instructor = ma.String()

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
        # Check if tables exist
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if not existing_tables:
            print("Creating all tables...")
            db.create_all()
        else:
            print("Tables already exist, skipping creation.")

        logger.info("Initializing timetable...")
        initialize_timetable()

        logger.info("Checking user table...")
        if not User.query.first():
            logger.info("User table is empty. Initializing with admin user...")
            initialize_user_table()
        else:
            logger.info("User table already contains data. Skipping initialization.")

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
        with open("timetable.json", "r") as f:
            timetable = json.load(f)
        for class_info in timetable:
            existing_class = GymClass.query.filter_by(name=class_info['name'], instructor=class_info['instructor']).first()
            if not existing_class:
                new_class = GymClass(name=class_info['name'], instructor=class_info['instructor'])
                db.session.add(new_class)
                db.session.flush()
            else:
                new_class = existing_class

            for occurrence in class_info.get('occurrences', []):
                existing_occurrence = Occurrence.query.filter_by(
                    gym_class_id=new_class.id,
                    day=occurrence['day'],
                    time=occurrence['time']
                ).first()
                if not existing_occurrence:
                    new_occurrence = Occurrence(
                        gym_class_id=new_class.id,
                        day=occurrence['day'],
                        time=occurrence['time'],
                        max_capacity=occurrence['max_capacity'],
                        current_capacity=occurrence['current_capacity']
                    )
                    db.session.add(new_occurrence)
        db.session.commit()
        print("Timetable initialized successfully")
    except Exception as e:
        print(f"Error initializing timetable: {e}")
        db.session.rollback()

def initialize_user_table():
    try:
        logger.info("Initializing user table...")
        sample_user = User(username="admin", is_admin=True)
        sample_user.set_password("admin")
        db.session.add(sample_user)
        db.session.flush()
        logger.info(f"Admin user created with ID: {sample_user.id}")

        sample_member = Member(
            name="Admin User",
            username="admin",
            membership_number="MEM001",
            date_of_birth=date(1990, 1, 1),
            member_since=date(2021, 1, 1),
            user_id=sample_user.id
        )

        db.session.add(sample_member)
        db.session.commit()
        logger.info(f"Added user: {sample_user.username} with associated member details")

        # Verify the user was added
        verify_user = User.query.filter_by(username="admin").first()
        if verify_user:
            logger.info(f"Verified admin user exists with ID: {verify_user.id}")
        else:
            logger.warning("Failed to verify admin user after initialization")
    except Exception as e:
        logger.error(f"Error initializing user table: {e}")
        db.session.rollback()

# Helper functions
def update_timetable_json():
    classes = GymClass.query.all()
    timetable_data = []
    for class_item in classes:
        class_data = {
            "id": class_item.id,
            "name": class_item.name,
            "instructor": class_item.instructor,
            "occurrences": [
                {
                    "day": occ.day,
                    "time": occ.time,
                    "max_capacity": occ.max_capacity,
                    "current_capacity": occ.current_capacity
                } for occ in class_item.occurrences
            ]
        }
        timetable_data.append(class_data)
    
    with open('timetable.json', 'w') as f:
        json.dump(timetable_data, f, indent=2)

# Routes
def register_routes(app):
    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.json
        username = data.get("username")
        password = data.get("password")
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            member = Member.query.filter_by(user_id=user.id).first()
            if member:
                member_data = member_schema.dump(member)
                member_data['is_admin'] = user.is_admin
                response = {
                    "success": True,
                    "message": "Login successful",
                    "member": member_data,
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }
                return jsonify(response), 200
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    @app.route("/api/classes", methods=["GET"])
    def get_classes():
        classes = GymClass.query.options(joinedload(GymClass.occurrences)).all()
        result = gym_classes_schema.dump(classes)
        print("Classes being sent to frontend:", result)
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
    @jwt_required()
    def schedule_class():
        try:
            data = request.json
            occurrence_id = data.get('occurrence_id')
            current_user_id = get_jwt_identity()

            logger.info(f"Attempting to schedule class for user {current_user_id}, occurrence {occurrence_id}")

            occurrence = Occurrence.query.get(occurrence_id)
            if not occurrence:
                logger.error(f"Occurrence not found for ID: {occurrence_id}")
                return jsonify({"success": False, "message": "Class not found"}), 404

            if occurrence.current_capacity >= occurrence.max_capacity:
                logger.warning(f"Class is full for occurrence ID: {occurrence_id}")
                return jsonify({"success": False, "message": "Class is full"}), 400

            # Check for existing booking
            existing_booking = Booking.query.filter_by(user_id=current_user_id, occurrence_id=occurrence_id).first()
            if existing_booking:
                logger.warning(f"User {current_user_id} already booked occurrence {occurrence_id}")
                return jsonify({"success": False, "message": "You have already booked this class"}), 400

            occurrence.current_capacity += 1
            booking = Booking(user_id=current_user_id, occurrence_id=occurrence_id)
            db.session.add(booking)
            db.session.commit()

            logger.info(f"Class scheduled successfully for user ID: {current_user_id}, occurrence ID: {occurrence_id}")
            return jsonify({
                "success": True,
                "message": "Class scheduled successfully",
                "current_capacity": occurrence.current_capacity
            }), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error scheduling class: {str(e)}")
            return jsonify({"success": False, "message": f"Failed to schedule class: {str(e)}"}), 500

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
        try:
            current_user_id = get_jwt_identity()
            logger.info(f"Fetching member details for user ID: {current_user_id}")
            member = Member.query.filter_by(user_id=current_user_id).first()
            if not member:
                logger.warning(f"Member not found for user ID: {current_user_id}")
                return jsonify({"error": "Member not found"}), 404
            result = member_schema.dump(member)
            logger.info(f"Member details retrieved for user ID: {current_user_id}")
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error fetching member details: {str(e)}")
            return jsonify({"error": str(e)}), 422

    @app.route("/api/validate-token", methods=["GET"])
    @jwt_required()
    def validate_token():
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if user:
                return jsonify({
                    "isValid": True,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "is_admin": user.is_admin
                    }
                }), 200
            else:
                return jsonify({"isValid": False, "error": "User not found"}), 404
        except Exception as e:
            return jsonify({"isValid": False, "error": str(e)}), 422


    @app.route("/api/refresh", methods=["POST"])
    @jwt_required(refresh=True)
    def refresh():
        current_user_id = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user_id)
        return jsonify({"access_token": new_access_token}), 200

    
    @app.route("/api/bookings", methods=["GET"])
    @jwt_required()
    def get_bookings():
        try:
            current_user_id = get_jwt_identity()
            bookings = Booking.query.filter_by(user_id=current_user_id).all()
            return jsonify([booking.to_dict() for booking in bookings]), 200
        except Exception as e:
            logger.error(f"Error fetching bookings: {str(e)}")
            return jsonify({"error": str(e)}), 422
    
    @app.route("/api/classes/cancel", methods=["POST"])
    @jwt_required()
    def cancel_class():
        try:
            data = request.json
            occurrence_id = data.get('occurrence_id')
            current_user_id = get_jwt_identity()
            
            booking = Booking.query.filter_by(occurrence_id=occurrence_id, user_id=current_user_id).first()
            if not booking:
                return jsonify({"success": False, "message": "Booking not found"}), 404
            
            # Decrease the current capacity of the occurrence
            occurrence = booking.occurrence
            occurrence.current_capacity -= 1
            
            db.session.delete(booking)
            db.session.commit()
            
            return jsonify({
                "success": True, 
                "message": "Booking cancelled successfully",
                "updated_occurrence": {
                    "id": occurrence.id,
                    "current_capacity": occurrence.current_capacity,
                    "max_capacity": occurrence.max_capacity
                }
            }), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error cancelling class: {str(e)}")
            return jsonify({"success": False, "message": f"Failed to cancel class: {str(e)}"}), 500

    @app.route("/api/admin/users", methods=["GET", "POST", "PUT", "DELETE"])
    @jwt_required()
    def manage_users():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        if request.method == "GET":
            users = User.query.all()
            return jsonify([{
                "id": u.id,
                "username": u.username,
                "name": u.member.name if u.member else None,
                "membership_number": u.member.membership_number if u.member else None,
                "date_of_birth": u.member.date_of_birth.strftime('%d/%m/%Y') if u.member and u.member.date_of_birth else None,
                "member_since": u.member.member_since.strftime('%d/%m/%Y') if u.member and u.member.member_since else None,
                "is_admin": u.is_admin
            } for u in users]), 200

        elif request.method == "POST":
            data = request.json
            logger.info(f"Received data for new user: {data}")
            try:
                date_of_birth = datetime.strptime(data['date_of_birth'], '%d/%m/%Y').date()
                member_since = datetime.strptime(data['member_since'], '%d/%m/%Y').date()

                new_user = User(username=data['username'], is_admin=data.get('is_admin', False))
                new_user.set_password(data['password'])
                db.session.add(new_user)
                db.session.flush()

                new_member = Member(
                    name=data['name'],
                    username=data['username'],
                    membership_number=data['membership_number'],
                    date_of_birth=date_of_birth,
                    member_since=member_since,
                    user_id=new_user.id
                )
                db.session.add(new_member)
                db.session.commit()
                return jsonify({"message": "User created successfully", "id": new_user.id}), 201
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error creating user: {str(e)}")
                return jsonify({"error": f"An error occurred: {str(e)}"}), 500


        elif request.method == "PUT":
            data = request.json
            logger.info(f"Received PUT request with data: {data}")
            user_to_update = User.query.get(data['id'])
            if not user_to_update:
                return jsonify({"error": "User not found"}), 404

            try:
                user_to_update.username = data['username']
                user_to_update.is_admin = data.get('is_admin', False)
                if 'password' in data and data['password']:
                    user_to_update.set_password(data['password'])

                member = Member.query.filter_by(user_id=user_to_update.id).first()
                if member:
                    member.name = data['name']
                    member.membership_number = data['membership_number']
                    member.date_of_birth = datetime.strptime(data['date_of_birth'], '%d/%m/%Y').date()
                    member.member_since = datetime.strptime(data['member_since'], '%d/%m/%Y').date()

                db.session.commit()
                return jsonify({"message": "User updated successfully"}), 200
            except KeyError as e:
                return jsonify({"error": f"Missing required field: {str(e)}"}), 400
            except ValueError as e:
                return jsonify({"error": f"Invalid date format: {str(e)}. Use DD/MM/YYYY."}), 400
            except Exception as e:
                db.session.rollback()
                return jsonify({"error": f"An error occurred: {str(e)}"}), 500

        elif request.method == "DELETE":
            user_id = request.args.get('id')
            user_to_delete = User.query.get(user_id)
            if not user_to_delete:
                return jsonify({"error": "User not found"}), 404

            try:
                # This will automatically delete the associated Member record
                db.session.delete(user_to_delete)
                db.session.commit()
                return jsonify({"message": "User deleted successfully"}), 200
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error deleting user: {str(e)}")
                return jsonify({"error": "An error occurred while deleting the user"}), 500

    @app.route("/api/admin/classes", methods=["GET", "POST", "PUT"])
    @jwt_required()
    def manage_classes():
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        if request.method == "GET":
            classes = GymClass.query.all()
            return jsonify(gym_classes_schema.dump(classes)), 200

        elif request.method == "POST":
            data = request.json
            if not data or 'name' not in data or 'occurrences' not in data or 'instructor' not in data:
                return jsonify({"error": "Invalid data format"}), 400
            try:
                new_class = GymClass(name=data['name'], instructor=data['instructor'])
                db.session.add(new_class)
                db.session.flush()

                for occ in data['occurrences']:
                    if 'day' not in occ or 'time' not in occ or 'max_capacity' not in occ:
                        raise ValueError("Invalid occurrence data")

                    new_occurrence = Occurrence(
                        gym_class_id=new_class.id,
                        day=occ['day'],
                        time=occ['time'],
                        max_capacity=int(occ['max_capacity']),
                        current_capacity=0
                    )
                    db.session.add(new_occurrence)

                db.session.commit()

                # Update timetable.json
                update_timetable_json()

                return jsonify({
                    "message": "Class created successfully", 
                    "id": new_class.id,
                    "name": new_class.name,
                    "instructor" : new_class.instructor,
                    "occurrences": [{
                        "day": occ.day,
                        "time": occ.time,
                        "max_capacity": occ.max_capacity,
                        "current_capacity": occ.current_capacity
                    } for occ in new_class.occurrences]
                }), 201

            except ValueError as e:
                db.session.rollback()
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                db.session.rollback()
                return jsonify({"error": "An error occurred while creating the class"}), 500


    @app.route("/api/admin/classes/<int:class_id>", methods=["PUT"])
    @jwt_required()
    def update_class(class_id):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.json
        class_to_update = GymClass.query.get(class_id)
        if not class_to_update:
            return jsonify({"error": "Class not found"}), 404

        class_to_update.name = data['name']
        class_to_update.instructor = data['instructor']

        # Update existing occurrences and add new ones
        existing_occurrence_ids = set(occ.id for occ in class_to_update.occurrences)
        for occ_data in data['occurrences']:
            if 'id' in occ_data and occ_data['id'] in existing_occurrence_ids:
                # Update existing occurrence
                occurrence = next(occ for occ in class_to_update.occurrences if occ.id == occ_data['id'])
                occurrence.day = occ_data['day']
                occurrence.time = occ_data['time']
                occurrence.max_capacity = occ_data['max_capacity']
                existing_occurrence_ids.remove(occ_data['id'])
            else:
                # Add new occurrence
                new_occurrence = Occurrence(
                    gym_class_id=class_to_update.id,
                    day=occ_data['day'],
                    time=occ_data['time'],
                    max_capacity=occ_data['max_capacity'],
                    current_capacity=0
                )
                db.session.add(new_occurrence)

        # Remove occurrences that are no longer in the updated data
        for occ_id in existing_occurrence_ids:
            occurrence_to_remove = next(occ for occ in class_to_update.occurrences if occ.id == occ_id)
            db.session.delete(occurrence_to_remove)

        db.session.commit()
        update_timetable_json()
        return jsonify({"message": "Class updated successfully"}), 200

    @app.route("/api/admin/classes/<int:id>", methods=["DELETE"])
    @jwt_required()
    def delete_class(id):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        class_to_delete = GymClass.query.get(id)
        if not class_to_delete:
            return jsonify({"error": "Class not found"}), 404

        db.session.delete(class_to_delete)
        db.session.commit()

        # Update timetable.json after deletion
        update_timetable_json()

        return jsonify({"message": "Class deleted successfully"}), 200

    # debug
    @app.route("/api/debug/classes", methods=["GET"])
    def debug_classes():
        classes = GymClass.query.all()
        return jsonify([{"id": c.id, "name": c.name} for c in classes])


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
