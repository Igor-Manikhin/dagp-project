import tensorflowjs as tfjs
from keras.models import model_from_json

json_file = open("gender_determination.json", "r")
loaded_model_json = json_file.read()
json_file.close()

loaded_model = model_from_json(loaded_model_json)
loaded_model.load_weights("gender_determination.h5")
loaded_model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])

tfjs.converters.save_keras_model(loaded_model, "neural_network")
