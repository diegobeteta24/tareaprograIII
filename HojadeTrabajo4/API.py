import os
import csv
from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

class NodoArbolAVL:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None
        self.altura = 1

class AVLTree:
    def insertar(self, raiz, valor):
        if raiz is None:
            return NodoArbolAVL(valor)
        elif valor < raiz.valor:
            raiz.izquierda = self.insertar(raiz.izquierda, valor)
        else:
            raiz.derecha = self.insertar(raiz.derecha, valor)

        raiz.altura = 1 + max(self.get_altura(raiz.izquierda), self.get_altura(raiz.derecha))

        balance = self.get_balance(raiz)

        # Rotación simple a la derecha
        if balance > 1 and valor < raiz.izquierda.valor:
            return self.rotar_derecha(raiz)

        # Rotación simple a la izquierda
        if balance < -1 and valor > raiz.derecha.valor:
            return self.rotar_izquierda(raiz)

        # Rotación doble a la derecha
        if balance > 1 and valor > raiz.izquierda.valor:
            raiz.izquierda = self.rotar_izquierda(raiz.izquierda)
            return self.rotar_derecha(raiz)

        # Rotación doble a la izquierda
        if balance < -1 and valor < raiz.derecha.valor:
            raiz.derecha = self.rotar_derecha(raiz.derecha)
            return self.rotar_izquierda(raiz)

        return raiz

    def get_altura(self, nodo):
        if not nodo:
            return 0
        return nodo.altura

    def get_balance(self, nodo):
        if not nodo:
            return 0
        return self.get_altura(nodo.izquierda) - self.get_altura(nodo.derecha)

    def rotar_derecha(self, z):
        y = z.izquierda
        T3 = y.derecha

        y.derecha = z
        z.izquierda = T3

        z.altura = 1 + max(self.get_altura(z.izquierda), self.get_altura(z.derecha))
        y.altura = 1 + max(self.get_altura(y.izquierda), self.get_altura(y.derecha))

        return y

    def rotar_izquierda(self, z):
        y = z.derecha
        T2 = y.izquierda

        y.izquierda = z
        z.derecha = T2

        z.altura = 1 + max(self.get_altura(z.izquierda), self.get_altura(z.derecha))
        y.altura = 1 + max(self.get_altura(y.izquierda), self.get_altura(y.derecha))

        return y

class ArbolAVL:
    def __init__(self):
        self.raiz = None
        self.avl = AVLTree()

    def insertar(self, valor):
        self.raiz = self.avl.insertar(self.raiz, valor)

arbol_avl = ArbolAVL()

def insertar_csv_a_arbol_binario(nombre_archivo):
    arbol_binario = ArbolAVL()

    try:
        with open(nombre_archivo, newline='') as archivo_csv:
            lector_csv = csv.DictReader(archivo_csv)
            for fila in lector_csv:
                id = fila['Identificación']
                nombre = fila['Nombre']
                arbol_binario.insertar((id, nombre))
    except FileNotFoundError:
        print(f"Error: El archivo CSV '{nombre_archivo}' no se encontró.")
    except Exception as e:
        print(f"Error al insertar datos desde el archivo CSV: {e}")

    return arbol_binario

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cargar_archivo_csv', methods=['GET', 'POST'])
def cargar_archivo_csv():
    if request.method == 'POST':
        archivo_csv = request.files['archivo_csv']
        if archivo_csv.filename != '':
            archivo_csv.save(archivo_csv.filename)
            return jsonify({'mensaje': f'Se ha cargado el archivo {archivo_csv.filename} correctamente.'}), 200
        else:
            return jsonify({'error': 'No se recibió ningún archivo CSV.'}), 400
    else:
        return render_template('cargar_archivo.html')


@app.route('/mostrar_datos_csv', methods=['GET'])
def mostrar_datos_csv():
    datos_csv = []
    nombre_archivo = request.args.get('archivo_csv')
    if nombre_archivo:
        try:
            with open(nombre_archivo, newline='') as archivo_csv:
                lector_csv = csv.DictReader(archivo_csv)
                for fila in lector_csv:
                    datos_csv.append(dict(fila))
            return jsonify({'datos': datos_csv}), 200
        except FileNotFoundError:
            return jsonify({'error': f'El archivo CSV {nombre_archivo} no se encontró.'}), 404
    else:
        return jsonify({'error': 'No se proporcionó el nombre del archivo CSV.'}), 400



@app.route('/integrantes', methods=['GET'])
def integrantes():
    nombres = ["Alan Billy Baten Guigui 9490-22-17906", "Diego antonio Beteta Garcia 9490-22-12878"]
    colaboracion = ["Implementación del árbol AVL y funciones relacionadas"]
    return jsonify({'nombres': nombres, 'colaboracion': colaboracion}), 200

if __name__ == "__main__":
    app.run(debug=True)

