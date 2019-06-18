import tensorflowjs as tfjs
from keras.models import model_from_json
from keras.optimizers import SGD

json_file = open("age_determination.json", "r")
loaded_model_json = json_file.read()
json_file.close()

loaded_model = model_from_json(loaded_model_json)
loaded_model.load_weights("age_determination.h5")
loaded_model.compile(loss="categorical_crossentropy", optimizer=SGD(lr=0.001, momentum=0.9, nesterov=True), metrics=["mae"])

tfjs.converters.save_keras_model(loaded_model, "neural_network_age")
